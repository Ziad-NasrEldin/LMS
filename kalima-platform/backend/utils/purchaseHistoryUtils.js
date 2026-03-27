const hasLectureAccessFromPurchase = (purchase) =>
  Boolean(
    purchase?.lecture ||
      (purchase?.container && purchase.container.type === "lecture") ||
      (purchase?.container &&
        Array.isArray(purchase.container.lectures) &&
        purchase.container.lectures.length > 0),
  )

module.exports = {
  hasLectureAccessFromPurchase,
}
