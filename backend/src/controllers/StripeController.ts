import { Request, Response } from 'express';
import Stripe from 'stripe';
import { AppDataSource } from '../orm/data-source';
import { CoachProfile } from '../entities/Coach';
import { Athlete } from '../entities/Athlete';
import { Subscription } from '../entities/Subscription';
import { CoachingRequest } from '../entities/CoachingRequest';
import { User } from '../entities/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16' as any // Use an expected api version, cast as any due to typings depending on the exact version installed
});

export class StripeController {

    // --- COACH: Onboarding ---
    static createConnectAccount = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const coachRepo = AppDataSource.getRepository(CoachProfile);
            const userRepo = AppDataSource.getRepository(User);

            const user = await userRepo.findOne({ where: { id: userId } });
            const coach = await coachRepo.findOne({ where: { userId } });

            if (!coach || !user) return res.status(404).json({ message: "Coach not found" });

            let accountId = coach.stripeAccountId;

            if (!accountId) {
                // Create a standard Connect account
                const account = await stripe.accounts.create({
                    type: 'standard',
                    email: user.email,
                });
                accountId = account.id;
                coach.stripeAccountId = accountId;
                await coachRepo.save(coach);
            }

            const origin = process.env.FRONTEND_URL || 'http://localhost:4200';
            
            // Create an account link for onboarding
            const accountLink = await stripe.accountLinks.create({
                account: accountId,
                refresh_url: `${origin}/dashboard/settings?stripe_status=refresh`,
                return_url: `${origin}/dashboard/settings?stripe_status=success`,
                type: 'account_onboarding',
            });

            res.json({ url: accountLink.url });
        } catch (error: any) {
            console.error("Error creating Connect account:", error);
            res.status(500).json({ message: error.message || "Error with Stripe onboarding" });
        }
    };

    // --- ATHLETE: Checkout ---
    static createCheckoutSession = async (req: Request, res: Response) => {
        try {
            const athleteUserId = (req as any).user.id;
            const { coachId } = req.body; // coach profile ID

            const coachRepo = AppDataSource.getRepository(CoachProfile);
            const athleteRepo = AppDataSource.getRepository(Athlete);

            const coach = await coachRepo.findOne({ where: { id: coachId }, relations: ['user'] });
            const athlete = await athleteRepo.findOne({ where: { userId: athleteUserId }, relations: ['user'] });

            if (!coach || !athlete) return res.status(404).json({ message: "User not found" });
            
            // For destination charges, the coach must be fully onboarded
            // (If we use standard accounts, they handle their own charges directly, but destination charges allow platform fees)
            if (!coach.stripeAccountId) {
                return res.status(400).json({ message: "This coach is not ready to receive payments yet." });
            }

            const origin = process.env.FRONTEND_URL || 'http://localhost:4200';
            const priceInCents = Math.round(Number(coach.monthlyPrice) * 100);
            
            // Platform fee (e.g. 10%)
            const applicationFeeAmount = Math.round(priceInCents * 0.10);

            // Create a checkout session for a subscription
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Coaching with ${coach.user.first_name || 'Coach'}`,
                            description: `Monthly coaching subscription`
                        },
                        unit_amount: priceInCents,
                        recurring: {
                            interval: 'month'
                        }
                    },
                    quantity: 1,
                }],
                mode: 'subscription',
                subscription_data: {
                    application_fee_percent: 10,
                    transfer_data: {
                        destination: coach.stripeAccountId
                    }
                },
                success_url: `${origin}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${origin}/dashboard?payment=canceled`,
                customer_email: athlete.user.email,
                client_reference_id: athlete.id.toString(),
                metadata: {
                    coachProfileId: coach.id.toString(),
                    athleteId: athlete.id.toString()
                }
            });

            res.json({ url: session.url });
        } catch (error: any) {
            console.error("Error creating checkout session:", error);
            res.status(500).json({ message: error.message || "Checkout error" });
        }
    };

    // --- WEBHOOK: Handle Events ---
    static webhookHandler = async (req: Request, res: Response) => {
        const sig = req.headers['stripe-signature'] as string;
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        let event: Stripe.Event;

        try {
            if (endpointSecret) {
                // req.body must be raw buffer for signature verification.
                // Note: Ensure express.raw({type: 'application/json'}) is used in the route before json parser.
                event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
            } else {
                event = req.body;
            }
        } catch (err: any) {
            console.error('Webhook signature verification failed.', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        const subscriptionRepo = AppDataSource.getRepository(Subscription);
        const requestRepo = AppDataSource.getRepository(CoachingRequest);

        try {
            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object as Stripe.Checkout.Session;
                    const athleteId = parseInt(session.metadata?.athleteId || '0');
                    const coachProfileId = session.metadata?.coachProfileId;
                    const subscriptionId = session.subscription as string;

                    if (athleteId && coachProfileId && subscriptionId) {
                        // Create or update subscription record
                        let sub = await subscriptionRepo.findOne({ where: { stripeSubscriptionId: subscriptionId } });
                        if (!sub) {
                            sub = subscriptionRepo.create({
                                athleteId,
                                coachProfileId,
                                stripeSubscriptionId: subscriptionId,
                                status: 'active'
                            });
                            await subscriptionRepo.save(sub);
                        }

                        // Auto-accept coaching request if pending, or create one
                        let coachingReq = await requestRepo.findOne({
                            where: { athleteId, coachProfileId }
                        });

                        if (coachingReq) {
                            coachingReq.status = 'accepted';
                            await requestRepo.save(coachingReq);
                        } else {
                            coachingReq = requestRepo.create({
                                athleteId,
                                coachProfileId,
                                status: 'accepted',
                                initiator: 'athlete',
                                message: 'Automated request via Stripe subscription'
                            });
                            await requestRepo.save(coachingReq);
                        }
                    }
                    break;
                }
                
                case 'customer.subscription.deleted':
                case 'customer.subscription.updated': {
                    const subscription = event.data.object as Stripe.Subscription;
                    const sub = await subscriptionRepo.findOne({ where: { stripeSubscriptionId: subscription.id } });
                    if (sub) {
                        sub.status = subscription.status;
                        sub.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
                        await subscriptionRepo.save(sub);

                        // If canceled, remove active coaching link
                        if (sub.status === 'canceled') {
                            const coachingReq = await requestRepo.findOne({
                                where: { athleteId: sub.athleteId, coachProfileId: sub.coachProfileId }
                            });
                            if (coachingReq) {
                                coachingReq.status = 'rejected'; // or some 'inactive' state
                                await requestRepo.save(coachingReq);
                            }
                        }
                    }
                    break;
                }

                default:
                    console.log(`Unhandled event type ${event.type}`);
            }

            res.json({ received: true });
        } catch (error) {
            console.error("Error processing webhook:", error);
            res.status(500).json({ error: "Webhook processing error" });
        }
    };
}
