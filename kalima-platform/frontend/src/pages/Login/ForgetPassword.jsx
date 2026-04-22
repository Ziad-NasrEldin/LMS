import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { requestPasswordReset } from '../../routes/auth-services';
import { designTokens } from '../../constants/designTokens';
import { translateErrorMessage } from '../../utils/errorTranslator';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

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
        setError(translateErrorMessage(response.message || t('errors.requestFailed'), t));
        return;
      }
      if (response.status === 'success') {
        setSuccess(translateErrorMessage(response.message, t));
        navigate('/verify-otp', { state: { email } });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error ||
                         err.message ||
                         t('errors.generalError');
      setError(translateErrorMessage(errorMessage, t));
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
          className="w-full max-w-md overflow-hidden rounded-[1.5rem] border bg-white"
          style={{
            borderColor: 'transparent',
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
              <div className="flex flex-col gap-1">
                <label className="py-1">
                  <span className="text-sm font-semibold">
                    {t('emailLabel', 'Email Address')}
                  </span>
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="youremail@example.com"
                    className={`w-full bg-slate-100/70 text-base ${
                      isRTL ? 'pr-12' : 'pl-12'
                    }`}
                    required
                  />
                  <Mail
                    className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900/50 ${
                      isRTL ? 'right-4' : 'left-4'
                    }`}
                  />
                </div>
              </div>
  
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm flex items-center gap-3">
                  <span>{error}</span>
                </div>
              )}
  
              {success && (
                <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-sm flex items-center gap-3">
                  <span>{success}</span>
                </div>
              )}
  
              <Button
                type="submit"
                size="lg"
                className={`w-full rounded-full text-base font-extrabold border-0 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                style={{ background: TOKENS.deepTeal, color: '#F8FCFF' }}
                disabled={loading}
              >
                {loading ? t('sending', 'Sending...') : t('sendOtp', 'Send OTP')}
              </Button>
  
              <p className="pt-1 text-center text-sm text-slate-900/70">
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
