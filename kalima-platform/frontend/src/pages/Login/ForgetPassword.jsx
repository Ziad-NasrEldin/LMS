import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { requestPasswordReset } from '../../routes/auth-services';
import { designTokens } from '../../constants/designTokens';

const TOKENS = designTokens.colors;
const SHADOWS = designTokens.shadows;
const GRADIENTS = designTokens.gradients;

const ForgotPassword = () => {
  const { t, i18n } = useTranslation("login");
  const isRTL = i18n.dir() === "rtl";
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
    <div
      className="min-h-screen pt-24 px-3 pb-8 sm:px-6 lg:px-8 flex items-center justify-center"
      style={{ background: TOKENS.creamSurface }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-45"
        style={{ background: GRADIENTS.pageAtmosphere }}
      />

      <div
        className="w-full max-w-md overflow-hidden rounded-[1.5rem] border bg-base-100"
        style={{
          borderColor: 'rgba(17,24,39,0.08)',
          boxShadow: SHADOWS.level2,
        }}
      >
        <div className="px-8 py-10">
          <div className="mb-8 space-y-1">
            <h1 className="text-3xl font-extrabold" style={{ color: TOKENS.inkText }}>
              {t('forgotPasswordTitle', 'Forgot Password')}
            </h1>
            <p className="text-base" style={{ color: TOKENS.slateText }}>
              {t('forgotPasswordSubtitle', 'Enter your email address to receive a password reset code.')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-semibold">
                  {t('emailLabel', 'Email Address')}
                </span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="youremail@example.com"
                  className={`input input-bordered input-md w-full bg-base-200/70 text-base ${
                    isRTL ? 'pr-12' : 'pl-12'
                  }`}
                  required
                />
                <Mail
                  className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/50 ${
                    isRTL ? 'right-4' : 'left-4'
                  }`}
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              className={`btn btn-lg w-full rounded-full text-base font-extrabold border-0 ${loading ? 'loading' : ''}`}
              style={{ background: TOKENS.deepTeal, color: '#F8FCFF' }}
              disabled={loading}
            >
              {loading ? t('sending', 'Sending...') : t('sendOtp', 'Send OTP')}
            </button>

            <p className="pt-1 text-center text-sm text-base-content/70">
              {t('backToLogin', 'Remembered your password?')}{' '}
              <Link to="/login" className="font-bold text-primary hover:underline">
                {t('login', 'Login here')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
