import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '../../routes/auth-services';
import WaveBackground from './WaveBackground';

const ForgotPassword = () => {
  const { t, i18n } = useTranslation("login");
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await requestPasswordReset(email);
      if (response.status !== 'success') {
        setError(response.message || t('errors.requestFailed'));
        return;
      }
      if (response.status === 'success') {
        setSuccess(response.message);
        navigate('/verify-otp', { state: { email } });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                         err.message || 
                         t('errors.generalError');
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-base-100" dir={isRTL ? 'rtl' : 'ltr'}>
      <WaveBackground />
      
      <div className="w-full max-w-md p-6 z-10">
        <div className="bg-base-100 shadow-xl rounded-lg p-6">
          <h1 className="text-3xl font-bold text-center mb-2">
            {t('forgotPasswordTitle', 'Forgot Password')}
          </h1>
          <p className="text-center text-base-600 mb-6">
            {t('forgotPasswordSubtitle', 'Enter your email address to receive a password reset code.')}
          </p>

          <form onSubmit={handleSubmit} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text mb-2">{t('emailLabel', 'Email Address')}</span>
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="youremail@example.com"
                className="input input-bordered w-full"
                required
              />
            </div>

            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success mb-4">
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? t('sending', 'Sending...') : t('sendOtp', 'Send OTP')}
            </button>

            <div className="text-center mt-4">
              <p>
                {t('backToLogin', 'Remembered your password?')}{' '}
                <Link to="/login" className="link link-primary">
                  {t('login', 'Login here')}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;