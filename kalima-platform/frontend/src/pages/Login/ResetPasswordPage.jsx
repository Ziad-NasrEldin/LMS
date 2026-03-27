import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../routes/auth-services';
import WaveBackground from './WaveBackground';

const ResetPassword = () => {
  const { t, i18n } = useTranslation("login");
  const isRTL = i18n.dir() === "rtl";
  const navigate = useNavigate();
  const location = useLocation();
  const { email, resetToken } = location.state || {};
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      setLoading(false);
      return;
    }

    try {
      const response = await resetPassword(resetToken, password, confirmPassword);
      if (response.status !== 'success') {
        setError(response.message || t('errors.resetFailed'));
        return;
      }
      if (response.status === 'success') {
        setShowToast(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    }  catch (err) {
      const errorMessage = err.response?.data?.error || 
                         err.message || 
                         t('errors.generalError');
      setError(errorMessage);
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
            {t('resetPasswordTitle')}
          </h1>
          <p className="text-center text-base-600 mb-6">
            {t('resetPasswordSubtitle')}
          </p>

          <form onSubmit={handleSubmit} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">{t('passwordLabel')}</span>
              </label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                className="input input-bordered w-full"
                required
              />
            </div>

            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text">{t('confirmPasswordLabel')}</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                className="input input-bordered w-full"
                required
              />
            </div>

            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? t('resetting') : t('resetPassword')}
            </button>

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

      {showToast && (
        <div className="toast toast-top toast-end">
          <div className="alert alert-success">
            <span>{t('passwordResetSuccess')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetPassword;
