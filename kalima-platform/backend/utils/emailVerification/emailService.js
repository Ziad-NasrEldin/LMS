const { Resend } = require('resend');
const { buildOtpEmailTemplate, EMAIL_TYPES } = require('./emailTemplates');

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
    const fromEmail = 'Fekra Team <noreply@kalima-edu.com>';

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
  const { subject, html } = buildOtpEmailTemplate({ type: EMAIL_TYPES.verification, otp });

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