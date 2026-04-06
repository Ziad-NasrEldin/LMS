import React from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { designTokens } from "../constants/designTokens";

const TOKENS = designTokens.colors;

const SessionConfirmModal = ({ isOpen, onConfirm, onCancel }) => {
  const { t, i18n } = useTranslation("login");
  const isRTL = i18n.dir() === "rtl";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: "#FEF3C7" }}
            >
              <AlertTriangle className="h-6 w-6" style={{ color: "#D97706" }} />
            </div>
            <h3
              className="text-lg font-bold"
              style={{ color: TOKENS.inkText }}
            >
              {t("sessionConfirm.title")}
            </h3>
          </div>

          <p className="mb-6 text-base" style={{ color: TOKENS.slateText }}>
            {t("sessionConfirm.message")}
          </p>

          <div className="flex gap-3" dir={isRTL ? "rtl" : "ltr"}>
            <button
              onClick={onCancel}
              className="btn btn-md flex-1 rounded-xl border-2 font-semibold"
              style={{
                borderColor: "#E5E7EB",
                backgroundColor: "white",
                color: TOKENS.slateText,
              }}
            >
              {t("sessionConfirm.cancel")}
            </button>
            <button
              onClick={onConfirm}
              className="btn btn-md flex-1 rounded-xl border-0 font-semibold"
              style={{
                backgroundColor: TOKENS.deepTeal,
                color: "white",
              }}
            >
              {t("sessionConfirm.continue")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionConfirmModal;
