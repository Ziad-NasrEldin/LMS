const DATE_FORMAT_OPTIONS = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
}

const toLocalizedDateTime = (value, language) =>
  new Date(value).toLocaleString(language, DATE_FORMAT_OPTIONS)

export const mapRedeemedCodesForDashboard = ({ redeemedCodes = [], pointsBalances = [], t, language }) =>
  redeemedCodes.map((code, index) => ({
    id: `code-${index + 1}`,
    type: t("transactions.types.codeRedemption"),
    code: code.code,
    amount: code.pointsAmount,
    instructorName: code.lecturerId
      ? pointsBalances.find((balanceItem) => balanceItem.lecturer?._id === code.lecturerId)?.lecturer?.name ||
        t("notAvailable")
      : t("generalPoints"),
    createdAt: toLocalizedDateTime(code.redeemedAt, language),
    isRedemption: true,
  }))

export const mapRedeemedCodesForChild = ({ redeemedCodes = [], t, language }) =>
  redeemedCodes.map((code, index) => ({
    id: `code-${index + 1}`,
    type: t("transactions.types.codeRedemption"),
    code: code.code,
    amount: code.pointsAmount,
    instructorName: code.lecturerId ? t("notAvailable") : t("generalPoints"),
    createdAt: toLocalizedDateTime(code.redeemedAt, language),
    isRedemption: true,
  }))

export const mapPurchaseHistoryTransactions = ({ purchaseHistory = [], t, language }) =>
  purchaseHistory.map((purchase, index) => ({
    id: `purchase-${index + 1}`,
    type: t("transactions.types.coursePurchase"),
    code: purchase.description,
    amount: purchase.points,
    instructorName: purchase.lecturer?.name || t("notAvailable"),
    createdAt: toLocalizedDateTime(purchase.purchasedAt, language),
    isRedemption: false,
  }))

export const combineTransactionsByNewest = (redeemedCodes = [], purchaseHistory = []) =>
  [...redeemedCodes, ...purchaseHistory].sort((firstItem, secondItem) => new Date(secondItem.createdAt) - new Date(firstItem.createdAt))
