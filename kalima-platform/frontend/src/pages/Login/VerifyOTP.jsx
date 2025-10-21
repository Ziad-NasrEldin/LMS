import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { requestPasswordReset, verifyOtp } from '../../routes/auth-services';
import WaveBackground from './WaveBackground';

const VerifyOtp = () => {
  const { t, i18n } = useTranslation("login");
  const isRTL = i18n.language === 'ar';
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let timer;
    if (resendDisabled && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setResendDisabled(false);
      setCountdown(60);
    }
    return () => clearInterval(timer);
  }, [resendDisabled, countdown]);

  const handleResendCode = async () => {
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
        setResendDisabled(true);
        setCountdown(60);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                         err.message || 
                         t('errors.generalError');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await verifyOtp(email, otp);
      if (response.status !== 'success') {
        setError(response.message || t('errors.invalidOtp'));
        return;
      }
      if (response.status === 'success') {
        setSuccess(response.message);
        navigate('/reset-password', { state: { email, resetToken: response.resetToken } });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                         err.message || 
                         t('errors.generalError');
      setError(errorMessage);
  } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-base-100"
     dir={isRTL ? 'rtl' : 'ltr'} >
      <WaveBackground />
      
      <div className="w-full max-w-md p-6 z-10">
        <div className="bg-base-100 shadow-xl rounded-lg p-6">
          <h1 className="text-3xl font-bold text-center mb-2">
            {t('verifyOtpTitle', 'Verify OTP')}
          </h1>
          <p className="text-center text-base-600 mb-6">
            {t('verifyOtpSubtitle', 'Enter the OTP sent to your email.')}
          </p>

          <form onSubmit={handleSubmit} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text">{t('otpLabel', 'OTP Code')}</span>
              </label>
              <input
                type="text"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="OTP"
                className="input input-bordered w-full"
                required
              />
              <label className="label">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className={`label-text-alt link ${resendDisabled ? 'text-base-400 cursor-not-allowed' : 'link-hover text-primary'}`}
                  disabled={resendDisabled}
                >
                  {resendDisabled
                    ? t('resendCodeIn', 'Resend Code in {{countdown}}s', { countdown })
                    : t('resendCode', 'Resend Code')}
                </button>
              </label>
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
              {loading ? t('verifying', 'Verifying...') : t('verifyOtp', 'Verify OTP')}
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

export default VerifyOtp;