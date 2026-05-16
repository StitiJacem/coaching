import admin from 'firebase-admin';

// Check if Firebase service account is available in the environment
// Usually this is a path to the JSON file or the JSON string itself.
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

let isFirebaseInitialized = false;

try {
    if (serviceAccountPath) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountPath),
        });
        isFirebaseInitialized = true;
        console.log('Firebase Admin SDK initialized successfully.');
    } else {
        console.warn('\n⚠️ [FIREBASE] FIREBASE_SERVICE_ACCOUNT_PATH is not set.');
        console.warn('⚠️ Push notifications are currently MOCKED and will only log to the console.\n');
    }
} catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
}

/**
 * Sends a push notification to a specific device using FCM.
 * If Firebase is not initialized (e.g. missing credentials), it mocks the process.
 * 
 * @param token The FCM device token
 * @param title Notification title
 * @param body Notification body
 * @param data Optional payload data
 */
export async function sendPushNotification(token: string | null | undefined, title: string, body: string, data: Record<string, string> = {}): Promise<boolean> {
    if (!token) {
        console.log(`[PUSH NOTIF MOCK] Skipped sending. User has no FCM token. Title: "${title}"`);
        return false;
    }

    if (!isFirebaseInitialized) {
        console.log(`\n--- [PUSH NOTIF MOCK] ---`);
        console.log(`To: ${token}`);
        console.log(`Title: ${title}`);
        console.log(`Body: ${body}`);
        console.log(`Data: ${JSON.stringify(data)}`);
        console.log(`-------------------------\n`);
        return true;
    }

    try {
        const message = {
            notification: {
                title,
                body,
            },
            data,
            token,
        };

        const response = await admin.messaging().send(message);
        console.log('Successfully sent push notification:', response);
        return true;
    } catch (error) {
        console.error('Error sending push notification:', error);
        return false;
    }
}
