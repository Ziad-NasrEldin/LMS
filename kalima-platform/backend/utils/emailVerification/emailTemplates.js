const emailDesignTokens = require("./emailDesignTokens");

const EMAIL_TYPES = {
  verification: "verification",
  password_reset: "password_reset",
};

const EMAIL_CONTENT = {
  [EMAIL_TYPES.verification]: {
    subject: "رمز التحقق من البريد الإلكتروني",
    headerTitle: "تأكيد البريد الإلكتروني",
    intro:
      "أهلًا بك في منصة فكرة. استخدم الرمز التالي لإكمال تأكيد بريدك الإلكتروني.",
    otpLabel: "رمز التحقق",
    expiry: "هذا الرمز صالح لمدة 10 دقائق فقط.",
    help:
      "إذا لم تقم بطلب هذا الرمز، يمكنك تجاهل الرسالة بأمان ولن يتم إجراء أي تغيير على حسابك.",
    footer: "فريق فكرة",
  },
  [EMAIL_TYPES.password_reset]: {
    subject: "رمز إعادة تعيين كلمة المرور",
    headerTitle: "إعادة تعيين كلمة المرور",
    intro:
      "تلقّينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك. استخدم الرمز التالي للتحقق من هويتك.",
    otpLabel: "رمز إعادة التعيين",
    expiry: "هذا الرمز صالح لمدة 10 دقائق فقط.",
    help:
      "إذا لم تقم بطلب إعادة التعيين، يرجى تجاهل هذه الرسالة. يمكنك التواصل مع الدعم إذا لاحظت أي نشاط غير معتاد.",
    footer: "فريق فكرة",
  },
};

const normalizeOtp = (otp) => String(otp ?? "").replace(/[^\d]/g, "");

const buildOtpEmailTemplate = ({ type = EMAIL_TYPES.verification, otp }) => {
  const content = EMAIL_CONTENT[type] || EMAIL_CONTENT[EMAIL_TYPES.verification];
  const tokens = emailDesignTokens;
  const safeOtp = normalizeOtp(otp);

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${content.subject}</title>
  </head>
  <body style="margin:0;padding:0;background:${tokens.colors.neutralCloud};font-family:${tokens.typography.body};color:${tokens.colors.inkText};direction:rtl;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${tokens.colors.neutralCloud};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;background:${tokens.colors.white};border-radius:${tokens.radius.section};overflow:hidden;box-shadow:${tokens.shadows.level1};">
            <tr>
              <td style="background:${tokens.gradients.hero};padding:26px 28px;text-align:right;">
                <p style="margin:0;color:${tokens.colors.lightAquaMist};font-size:13px;line-height:1.4;font-family:${tokens.typography.body};">Fekra</p>
                <h1 style="margin:8px 0 0;color:${tokens.colors.white};font-size:30px;line-height:1.25;font-family:${tokens.typography.heading};font-weight:800;">
                  ${content.headerTitle}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 28px;background:${tokens.colors.creamSurface};">
                <p style="margin:0 0 20px;color:${tokens.colors.slateText};font-size:16px;line-height:1.8;">
                  ${content.intro}
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${tokens.gradients.appPanel};border:1px solid ${tokens.colors.lightAquaMist};border-radius:${tokens.radius.card};">
                  <tr>
                    <td style="padding:18px 20px;text-align:center;">
                      <p style="margin:0 0 8px;color:${tokens.colors.deepTeal};font-size:13px;font-weight:700;">
                        ${content.otpLabel}
                      </p>
                      <p style="margin:0;color:${tokens.colors.inkText};font-size:34px;line-height:1.3;letter-spacing:8px;font-family:${tokens.typography.otp};font-weight:800;direction:ltr;text-align:center;">
                        ${safeOtp}
                      </p>
                    </td>
                  </tr>
                </table>
                <p style="margin:16px 0 0;color:${tokens.colors.deepTeal};font-size:14px;line-height:1.7;font-weight:700;">
                  ${content.expiry}
                </p>
                <p style="margin:14px 0 0;color:${tokens.colors.slateText};font-size:14px;line-height:1.8;">
                  ${content.help}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:${tokens.colors.white};border-top:1px solid ${tokens.colors.neutralCloud};">
                <p style="margin:0;color:${tokens.colors.slateText};font-size:13px;line-height:1.7;">
                  مع التحية،<br />${content.footer}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    content.headerTitle,
    "",
    content.intro,
    "",
    `${content.otpLabel}: ${safeOtp}`,
    content.expiry,
    "",
    content.help,
    "",
    `مع التحية، ${content.footer}`,
  ].join("\n");

  return {
    subject: content.subject,
    html,
    text,
  };
};

module.exports = {
  EMAIL_TYPES,
  buildOtpEmailTemplate,
};
