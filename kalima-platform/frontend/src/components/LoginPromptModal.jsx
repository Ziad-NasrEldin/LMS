"use client"

import { FiX, FiLogIn, FiUserPlus } from "react-icons/fi"
import { useTranslation } from "react-i18next"
import { designTokens } from "../constants/designTokens"

const LoginPromptModal = ({ isOpen, onClose, onLogin, onRegister, isRTL }) => {
  const { t } = useTranslation("courseDetails")
  const TOKENS = designTokens.colors

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relative w-full max-w-md rounded-[2rem] border bg-white p-8 shadow-2xl"
        style={{
          borderColor: "rgba(17,24,39,0.08)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 transition-colors hover:bg-gray-100"
          style={{ color: TOKENS.slateText }}
        >
          <FiX className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: `${TOKENS.deepTeal}15` }}
          >
            <FiLogIn className="h-8 w-8" style={{ color: TOKENS.deepTeal }} />
          </div>
        </div>

        {/* Title */}
        <h3
          className="mb-3 text-center text-2xl font-bold"
          style={{ color: TOKENS.inkText }}
        >
          {t("loginPrompt.title", "Login Required")}
        </h3>

        {/* Message */}
        <p
          className="mb-8 text-center text-base"
          style={{ color: TOKENS.slateText }}
        >
          {t(
            "loginPrompt.message",
            "Please create an account or login to purchase this course"
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onLogin}
            className="flex w-full items-center justify-center gap-2 rounded-full py-4 font-bold text-white transition-all hover:scale-[1.02]"
            style={{ background: TOKENS.deepTeal }}
          >
            <FiLogIn className="h-5 w-5" />
            {t("loginPrompt.loginButton", "Login")}
          </button>

          <button
            onClick={onRegister}
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 py-4 font-bold transition-all hover:scale-[1.02]"
            style={{
              borderColor: TOKENS.deepTeal,
              color: TOKENS.deepTeal,
              background: "white",
            }}
          >
            <FiUserPlus className="h-5 w-5" />
            {t("loginPrompt.registerButton", "Create Account")}
          </button>

          <button
            onClick={onClose}
            className="mt-2 rounded-full py-3 font-medium transition-colors"
            style={{ color: TOKENS.slateText }}
          >
            {t("loginPrompt.cancel", "Cancel")}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPromptModal
