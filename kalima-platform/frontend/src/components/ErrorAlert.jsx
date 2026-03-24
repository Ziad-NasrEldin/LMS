import { useTranslation } from "react-i18next";
import { designTokens } from "../constants/designTokens";

export function ErrorAlert({ error, message, onRetry, retryLabel }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const TOKENS = designTokens.colors;
  const SHADOWS = designTokens.shadows;
  const resolvedError = error || message;

  return (
    <div
      className="alert alert-error max-w-2xl mx-auto"
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        borderColor: "rgba(214, 64, 85, 0.28)",
        background: "linear-gradient(135deg, rgba(255, 235, 239, 0.95) 0%, rgba(255, 245, 246, 0.95) 100%)",
        color: TOKENS.inkText,
        boxShadow: SHADOWS.level1,
      }}
    >
      <p className="font-medium leading-7">{resolvedError}</p>
      {onRetry && (
        <button
          className="btn btn-sm border-0"
          style={{
            background: TOKENS.deepTeal,
            color: "#F8FCFF",
          }}
          onClick={onRetry}
        >
          {retryLabel || (isRTL ? "إعادة المحاولة" : "Retry")}
        </button>
      )}
    </div>
  );
}