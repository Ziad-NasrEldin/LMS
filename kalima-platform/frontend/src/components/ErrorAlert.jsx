import { useTranslation } from "react-i18next";
import { designTokens } from "../constants/designTokens";
import Button from "./ui/Button"

export function ErrorAlert({ error, message, onRetry, retryLabel }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const TOKENS = designTokens.colors;
  const SHADOWS = designTokens.shadows;
  const resolvedError = error || message;

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg max-w-2xl mx-auto"
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        borderColor: "rgba(214, 64, 85, 0.28)",
        background: "linear-gradient(135deg, rgba(255, 235, 239, 0.95) 0%, rgba(255, 245, 246, 0.95) 100%)",
        color: TOKENS.inkText,
        boxShadow: SHADOWS.level1,
        borderWidth: '1px',
        borderStyle: 'solid'
      }}
    >
      <p className="font-medium leading-7">{resolvedError}</p>
      {onRetry && (
        <Button
          size="sm"
          className="border-0"
          style={{
            background: TOKENS.deepTeal,
            color: "#F8FCFF",
          }}
          onClick={onRetry}
        >
          {retryLabel || (isRTL ? "إعادة المحاولة" : "Retry")}
        </Button>
      )}
    </div>
  );
}