const { Resend } = require('resend');
const { EMAIL_TYPES, buildOtpEmailTemplate } = require('./emailTemplates');

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
 * @param {object|string} payload - Email payload object OR recipient email string
 * @param {string} payload.to - Recipient email
 * @param {string} payload.subject - Email subject
 * @param {string} payload.html - HTML content of the email
 * @param {string} payload.text - Plain text content of the email
 * @returns {Promise} - Promise resolving to the sent message info
 */
const sendEmail = async (payloadOrTo, maybeSubject, maybeHtml) => {
  const payload =
    typeof payloadOrTo === 'object' && payloadOrTo !== null
      ? payloadOrTo
      : {
          to: payloadOrTo,
          subject: maybeSubject,
          html: maybeHtml,
        };

  const { to, subject, html, text } = payload;

  // If Resend API key is not set, skip sending.
  if (!process.env.RESEND_API_KEY) {
    debugEmailLog('Resend API key not set. Email send skipped for:', to);
    return { id: 'api-key-missing' };
  }

  try {
    const fromEmail = process.env.EMAIL_FROM || 'Kalima Team <noreply@kalima-edu.com>';

    debugEmailLog('Sending email from:', fromEmail);
    
    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
      text,
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
 * @param {object} options
 * @param {('verification'|'password_reset')} options.type
 * @returns {Promise} - Promise resolving to the sent message info
 */
const sendOTPEmail = async (to, otp, options = {}) => {
  const { type = EMAIL_TYPES.verification } = options;
  const { subject, html, text } = buildOtpEmailTemplate({ type, otp });

  try {
    return await sendEmail({ to, subject, html, text });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    debugEmailLog('OTP email delivery failed for:', to);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  EMAIL_TYPES,
};
