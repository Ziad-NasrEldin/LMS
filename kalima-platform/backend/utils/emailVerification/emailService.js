const { Resend } = require('resend');

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

const isEmailDebugEnabled =
  String(process.env.EMAIL_DEBUG || 'false').toLowerCase() === 'true' &&
  String(process.env.NODE_ENV || '').toLowerCase() !== 'production';

const debugEmailLog = (...args) => {
  if (isEmailDebugEnabled) {
    console.log(...args);
  }
};

/**
 * Send an email using Resend
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content of the email
 * @returns {Promise} - Promise resolving to the sent message info
 */
const sendEmail = async (to, subject, html) => {
  // If Resend API key is not set, skip sending.
  if (!process.env.RESEND_API_KEY) {
    debugEmailLog('Resend API key not set. Email send skipped for:', to);
    return { id: 'api-key-missing' };
  }

  try {
    // Using your verified domain directly
    const fromEmail = 'Kalima Team <noreply@kalima-edu.com>';

    debugEmailLog('Sending email from:', fromEmail);
    
    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });
    
    debugEmailLog('Email sent successfully', data?.id || 'ok');
    return data;
  } catch (error) {
    console.error('Error sending email with Resend:', error);
    throw error;
  }
};

/**
 * Send an OTP verification email
 * @param {string} to - Recipient email
 * @param {string} otp - The OTP code
 * @returns {Promise} - Promise resolving to the sent message info
 */
const sendOTPEmail = async (to, otp) => {
  const subject = 'Your Email Verification Code';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333;">Email Verification</h2>
      <p style="color: #555; font-size: 16px;">Thank you for registering with Kalima. Please use the following code to verify your email address:</p>
      <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
        ${otp}
      </div>
      <p style="color: #777; font-size: 14px;">This code will expire in 10 minutes.</p>
    </div>
  `;

  try {
    return await sendEmail(to, subject, html);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    debugEmailLog('OTP email delivery failed for:', to);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendOTPEmail
};