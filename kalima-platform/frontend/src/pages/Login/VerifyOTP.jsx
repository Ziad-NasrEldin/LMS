import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { requestPasswordReset, verifyOtp } from '../../routes/auth-services';
import { translateErrorMessage } from '../../utils/errorTranslator';
import WaveBackground from './WaveBackground';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const VerifyOtp = () => {
  const { t, i18n } = useTranslation("login");
  const isRTL = i18n.dir() === "rtl";
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
        setError(translateErrorMessage(response.message || t('errors.requestFailed'), t));
        return;
      }
      if (response.status === 'success') {
        setSuccess(translateErrorMessage(response.message, t));
        setResendDisabled(true);
        setCountdown(60);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                         err.message || 
                         t('errors.generalError');
      setError(translateErrorMessage(errorMessage, t));
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
        setError(translateErrorMessage(response.message || t('errors.invalidOtp'), t));
        return;
      }
      if (response.status === 'success') {
        setSuccess(translateErrorMessage(response.message, t));
        navigate('/reset-password', { state: { email, resetToken: response.resetToken } });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                         err.message || 
                         t('errors.generalError');
      setError(translateErrorMessage(errorMessage, t));
  } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-white"
     dir={isRTL ? 'rtl' : 'ltr'} >
      <WaveBackground />
      
      <div className="w-full max-w-md p-6 z-10">
        <div className="bg-white shadow-xl rounded-lg p-6">
          <h1 className="text-3xl font-bold text-center mb-2">
            {t('verifyOtpTitle')}
          </h1>
          <p className="text-center text-base-600 mb-6">
            {t('verifyOtpSubtitle')}
          </p>

          <form onSubmit={handleSubmit} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text">{t('otpLabel')}</span>
              </label>
               <Input
                 type="text"
                 name="otp"
                 value={otp}
                 onChange={(e) => setOtp(e.target.value)}
                 placeholder={t('otpPlaceholder')}
                 className="w-full"
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
                    ? t('resendCodeIn', { countdown })
                    : t('resendCode')}
                </button>
              </label>
            </div>

             {error && (
               <div className="flex items-center gap-3 p-4 mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                 <span>{error}</span>
               </div>
             )}


             {success && (
               <div className="flex items-center gap-3 p-4 mb-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
                 <span>{success}</span>
               </div>
             )}


             <Button
               type="submit"
               variant="primary"
               className="w-full"
               isLoading={loading}
               disabled={loading}
             >
               {loading ? t('verifying') : t('verifyOtp')}
             </Button>


            <div className="text-center mt-4">
              <p>
                {t('backToLoginPrompt')}{' '}
                <Link to="/login" className="link link-primary">
                  {t('backToLogin')}
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
