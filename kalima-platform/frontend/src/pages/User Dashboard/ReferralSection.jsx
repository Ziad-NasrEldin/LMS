"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, X, Gift, Info, UserPlus } from "lucide-react"
import { updateCurrentUser } from "../../routes/update-user"
import { designTokens } from "../../constants/designTokens"
import { translateErrorMessage } from "../../utils/errorTranslator"
import Button from "../../components/ui/Button"
import Input from "../../components/ui/Input"


const TOKENS = designTokens.colors
const RADIUS = designTokens.radius
const SHADOWS = designTokens.shadows

const ReferralSection = ({ userInfo, onUserUpdate }) => {
  const { t } = useTranslation("promoCodes")

  const [referralSerial, setReferralSerial] = useState("")
  const [referralLoading, setReferralLoading] = useState(false)
  const [referralError, setReferralError] = useState(null)
  const [referralSuccess, setReferralSuccess] = useState(null)

  const hasUsedReferral = userInfo?.referralUsed || userInfo?.referredBy

  const handleSubmitReferral = async () => {
    if (!referralSerial.trim()) {
      setReferralError(t("referral.errors.emptySerial"))
      return
    }

    if (hasUsedReferral) {
      setReferralError(t("referral.errors.alreadyUsed"))
      return
    }

    setReferralLoading(true)
    setReferralError(null)
    setReferralSuccess(null)

    try {
      const updateData = {
        referralSerial: referralSerial.trim(),
      }

      const result = await updateCurrentUser(updateData)

      if (result.success) {
        setReferralSuccess(t("referral.success"))
        setReferralSerial("")

        if (onUserUpdate) {
          onUserUpdate()
        }
      } else {
        setReferralError(translateErrorMessage(result.error || t("referral.errors.generic"), t))
      }
    } catch (error) {
      setReferralError(t("referral.errors.generic"))
    } finally {
      setReferralLoading(false)
    }
  }

  if (hasUsedReferral) {
    return (
      <section className="mb-8 rounded-[2rem] border bg-white p-6" style={{ borderColor: TOKENS.borderSubtle, boxShadow: SHADOWS.level1, borderRadius: RADIUS.section }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black flex items-center gap-2" style={{ color: TOKENS.success }}>
            <Gift className="w-5 h-5" />
            {t("referral.completedTitle")}
          </h2>
          <div className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: TOKENS.success }}>
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3" />
              {t("referral.used")}
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ background: TOKENS.successLight, borderColor: TOKENS.successBorder }}>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" style={{ color: TOKENS.success }} />
            <span className="font-medium" style={{ color: TOKENS.success }}>
              {t("referral.alreadyApplied")}
            </span>
          </div>
        </div>
      </section>
    )
  }

    return (
      <section className="mb-8 rounded-[2rem] border p-6" style={{ background: TOKENS.neutralCloud, borderColor: TOKENS.borderSubtle, boxShadow: SHADOWS.level1, borderRadius: RADIUS.section }}>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black flex items-center gap-2" style={{ color: TOKENS.deepTeal }}>
          <UserPlus className="w-5 h-5" />
          {t("referral.title")}
        </h2>
        <div className="rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: "rgba(17,24,39,0.1)", color: TOKENS.slateText }}>
          {t("referral.oneTime")}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl p-4 border" style={{ background: "rgba(14,85,99,0.05)", borderColor: "rgba(14,85,99,0.1)" }}>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: TOKENS.deepTeal }} />
            <div>
              <h3 className="font-bold mb-1" style={{ color: TOKENS.deepTeal }}>{t("referral.infoTitle")}</h3>
              <p className="text-sm" style={{ color: TOKENS.slateText }}>
                {t("referral.infoDescription")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold block" style={{ color: TOKENS.slateText }}>
            {t("referral.label")}
            <span className="text-xs font-normal opacity-60 ml-1">{t("referral.required")}</span>
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={referralSerial}
              onChange={(e) => setReferralSerial(e.target.value)}
              placeholder={t("referral.placeholder")}
              className="flex-1 rounded-full"
              disabled={referralLoading}
            />

            <Button
              onClick={handleSubmitReferral}
              isDisabled={referralLoading || !referralSerial.trim()}
              variant="primary"
              className="rounded-full px-6"
              isLoading={referralLoading}
            >
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                {t("referral.button")}
              </div>
            </Button>
          </div>
        </div>

        {referralError && (
          <div className="flex items-center gap-3 p-3 rounded-xl shadow-sm bg-error/10 text-error border border-error/20">
            <X className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{referralError}</span>
          </div>
        )}

        {referralSuccess && (
          <div className="flex items-center gap-3 p-3 rounded-xl shadow-sm bg-success/10 text-success border border-success/20">
            <Check className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{referralSuccess}</span>
          </div>
        )}

        <div className="rounded-xl p-4 border" style={{ background: "rgba(241,243,246,0.5)", borderColor: "rgba(17,24,39,0.05)" }}>
          <h4 className="font-bold mb-3 flex items-center gap-2" style={{ color: TOKENS.deepTeal }}>
            <Gift className="w-4 h-4" />
            {t("referral.benefitsTitle")}
          </h4>
          <ul className="space-y-2 text-sm">
            {[t("referral.benefit1"), t("referral.benefit2"), t("referral.benefit3")].map((benefit, i) => (
              <li key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: TOKENS.deepTeal }}></div>
                <span style={{ color: TOKENS.slateText }}>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default ReferralSection
