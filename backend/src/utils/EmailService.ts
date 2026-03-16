import nodemailer from 'nodemailer';

export class EmailService {
  private static createTransporter() {
    const service = process.env.EMAIL_SERVICE || 'gmail';
    return nodemailer.createTransport({
      service: service,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  static async sendVerificationEmail(email: string, code: string, username: string): Promise<boolean> {
    const transporter = this.createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'GOSPORT - Code de Vérification',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #ff8a63 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">GOSPORT</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px;">
          <h2 style="color: #333;">Bonjour ${username} !</h2>
          <p style="color: #666; font-size: 16px;">Merci de vous être inscrit sur GOSPORT.</p>
          <p style="color: #666; font-size: 16px;">Voici votre code de vérification :</p>
          <div style="background: white; border: 2px solid #FF6B35; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #FF6B35; font-size: 36px; margin: 0; letter-spacing: 5px;">${code}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">Ce code est valide pendant 60 minutes.</p>
          <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">© 2026 GOSPORT. Tous droits réservés.</p>
        </div>
      </div>
    `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Verification email sent to:', email);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  static async sendProgramAcceptanceNotification(coachEmail: string, athleteName: string, programName: string): Promise<boolean> {
    const transporter = this.createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: coachEmail,
      subject: `GOSPORT - Program Accepted: ${athleteName}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #ff8a63 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">GOSPORT</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px;">
          <h2 style="color: #333;">Great news!</h2>
          <p style="color: #666; font-size: 16px;"><strong>${athleteName}</strong> has just accepted the program <strong>"${programName}"</strong>.</p>
          <p style="color: #666; font-size: 16px;">Training sessions will now begin appearing on their calendar based on their selected schedule.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/dashboard" style="background: #FF6B35; color: white; padding: 15px 30px; border-radius: 10px; text-decoration: none; font-weight: bold;">View Dashboard</a>
          </div>
        </div>
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">© 2026 GOSPORT. Tous droits réservés.</p>
        </div>
      </div>
    `
    };

    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending acceptance email:', error);
      return false;
    }
  }
}
