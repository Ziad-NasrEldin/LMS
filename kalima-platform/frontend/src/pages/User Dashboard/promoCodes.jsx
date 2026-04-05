"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Html5Qrcode } from "html5-qrcode"
import {
  Award,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Gift,
  GraduationCap,
  Info,
  QrCode,
  Search,
  Sparkles,
  Ticket,
  TrendingUp,
  User,
  UserCircle2,
  Users,
  Wallet,
  X,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { designTokens } from "../../constants/designTokens"
import { getToken, getUserDashboard } from "../../routes/auth-services"
import { redeemPromoCode } from "../../routes/codes"
import { getChildrenData } from "../../routes/parents"
import { updateCurrentUser } from "../../routes/update-user"
import ReferralSection from "./ReferralSection"
import {
  combineTransactionsByNewest,
  mapPurchaseHistoryTransactions,
  mapRedeemedCodesForChild,
  mapRedeemedCodesForDashboard,
} from "./promoCodes.utils"

const TOKENS = designTokens.colors
const SHADOWS = designTokens.shadows
const GRADIENTS = designTokens.gradients

const VISIBLE_PAGES = 5

const getVisiblePages = (currentPage, totalPages) => {
  if (totalPages <= VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5]
  }

  if (currentPage >= totalPages - 2) {
    return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2]
}

const PromoCodes = () => {
  const { t, i18n } = useTranslation("promoCodes")
  const isRTL = i18n.language === "ar"
  const navigate = useNavigate()
  const accessToken = getToken()

  const [transactions, setTransactions] = useState([])
  const [pointsBalances, setPointsBalances] = useState([])
  const [lectureAccess, setLectureAccess] = useState([])
  const [examScores, setExamScores] = useState([])
  const [redeemCode, setRedeemCode] = useState("")
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemError, setRedeemError] = useState("")
  const [redeemSuccess, setRedeemSuccess] = useState("")
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [lecturesPage, setLecturesPage] = useState(1)
  const [transactionsTotalPages, setTransactionsTotalPages] = useState(1)
  const [lectureAccessTotalPages, setLectureAccessTotalPages] = useState(1)
  const [activeTab, setActiveTab] = useState("transactions")
  const [isParent, setIsParent] = useState(false)
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [childrenLoading, setChildrenLoading] = useState(false)
  const [sequencedId, setSequencedId] = useState("")
  const [addChildLoading, setAddChildLoading] = useState(false)
  const [addChildError, setAddChildError] = useState("")
  const [addChildSuccess, setAddChildSuccess] = useState("")
  const [scannerLoading, setScannerLoading] = useState(false)
  const [scannerError, setScannerError] = useState("")
  const [userInfo, setUserInfo] = useState(null)

  const scannerRef = useRef(null)
  const scannerRunningRef = useRef(false)

  const selectedChildData = useMemo(
    () => children.find((child) => child._id === selectedChild) || null,
    [children, selectedChild],
  )

  useEffect(() => {
    if (!accessToken) {
      navigate("/login")
    }
  }, [accessToken, navigate])

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      setFetchError("")

      try {
        const pageToFetch = activeTab === "transactions" ? transactionsPage : lecturesPage
        const result = await getUserDashboard({ page: pageToFetch, limit: 10 })

        if (!result.success) {
          setFetchError(result.error || t("errors.fetchFailed"))
          return
        }

        const payload = result.data?.data || {}
        const {
          userInfo: info,
          pointsBalances: balances,
          redeemedCodes,
          purchaseHistory,
          lectureAccess: access,
          paginationInfo,
        } = payload

        setUserInfo(info)
        setBalance(info?.totalPoints || 0)
        setIsParent(info?.role === "Parent")

        if (selectedChild) return

        const mappedRedeemed = mapRedeemedCodesForDashboard({
          redeemedCodes,
          pointsBalances: balances,
          t,
          language: i18n.language,
        })

        const mappedPurchases = mapPurchaseHistoryTransactions({
          purchaseHistory,
          t,
          language: i18n.language,
        })

        setTransactions(combineTransactionsByNewest(mappedRedeemed, mappedPurchases))
        setPointsBalances(balances || [])
        setLectureAccess(access || [])

        if (paginationInfo) {
          setTransactionsTotalPages(
            Math.max(
              paginationInfo.purchaseHistory?.totalPages || 1,
              paginationInfo.redeemedCodes?.totalPages || 1,
            ),
          )
          setLectureAccessTotalPages(paginationInfo.lectureAccess?.totalPages || 1)
        }
      } catch (_error) {
        setFetchError(t("errors.fetchFailed"))
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [activeTab, transactionsPage, lecturesPage, selectedChild, redeemSuccess, t, i18n.language])

  useEffect(() => {
    const fetchChildren = async () => {
      if (!isParent) return

      setChildrenLoading(true)
      try {
        const result = await getChildrenData()
        if (result.success) {
          setChildren(result.data?.data?.children || [])
        }
      } finally {
        setChildrenLoading(false)
      }
    }

    fetchChildren()
  }, [isParent])

  useEffect(() => {
    if (!selectedChild) {
      setExamScores([])
      if (activeTab === "exams") {
        setActiveTab("transactions")
      }
      return
    }

    const child = children.find((item) => item._id === selectedChild)
    if (!child) return

    setBalance(child.totalPoints || 0)
    const mappedChildRedeemed = mapRedeemedCodesForChild({
      redeemedCodes: child.redeemedCodes,
      t,
      language: i18n.language,
    })
    const mappedChildPurchases = mapPurchaseHistoryTransactions({
      purchaseHistory: child.purchaseHistory,
      t,
      language: i18n.language,
    })
    setTransactions(combineTransactionsByNewest(mappedChildRedeemed, mappedChildPurchases))
    setLectureAccess(child.lectureAccess || [])
    setExamScores(child.examScores || [])
    setTransactionsTotalPages(1)
    setLectureAccessTotalPages(1)
  }, [selectedChild, children, t, i18n.language, activeTab])

  useEffect(() => {
    if (!addChildSuccess) return undefined
    const timeout = setTimeout(() => setAddChildSuccess(""), 3000)
    return () => clearTimeout(timeout)
  }, [addChildSuccess])

  useEffect(() => {
    const scannerModal = document.getElementById("scanner_modal")
    if (!scannerModal) return undefined

    const handleClose = () => {
      stopScanner()
    }

    scannerModal.addEventListener("close", handleClose)
    return () => {
      scannerModal.removeEventListener("close", handleClose)
    }
  }, [])

  const stopScanner = async () => {
    if (scannerRef.current && scannerRunningRef.current) {
      try {
        await scannerRef.current.stop()
      } catch (_error) {
      }
    }

    scannerRunningRef.current = false
    scannerRef.current = null
    setScannerLoading(false)
  }

  const onScanSuccess = async (decodedText) => {
    await stopScanner()
    document.getElementById("scanner_modal")?.close()

    let code = decodedText
    try {
      const parsed = JSON.parse(decodedText)
      if (parsed?.code) code = parsed.code
    } catch (_error) {
    }

    setRedeemCode(code)
    setRedeemError("")
    setRedeemSuccess("")
    document.getElementById("redeem_modal")?.showModal()
  }

  const startScanner = () => {
    setScannerError("")
    setScannerLoading(true)
    document.getElementById("redeem_modal")?.close()
    document.getElementById("scanner_modal")?.showModal()

    setTimeout(() => {
      try {
        const scanner = new Html5Qrcode("qr-reader")
        scannerRef.current = scanner

        scanner
          .start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 240, height: 240 } },
            onScanSuccess,
            () => {
            },
          )
          .then(() => {
            scannerRunningRef.current = true
            setScannerLoading(false)
          })
          .catch((_error) => {
            setScannerError(t("scanner.errors.cameraPermission"))
            setScannerLoading(false)
            scannerRef.current = null
          })
      } catch (_error) {
        setScannerError(t("scanner.errors.initFailed"))
        setScannerLoading(false)
      }
    }, 300)
  }

  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      setRedeemError(t("redeem.errors.emptyCode"))
      return
    }

    if (selectedChild) {
      setRedeemError(t("redeem.errors.childSelected"))
      return
    }

    setRedeemLoading(true)
    setRedeemError("")
    setRedeemSuccess("")

    try {
      const result = await redeemPromoCode(redeemCode)
      if (!result.success) {
        setRedeemError(result.error || t("redeem.errors.generic"))
      } else {
        setRedeemSuccess(t("redeem.success"))
        setRedeemCode("")
        setTransactionsPage(1)
        document.getElementById("redeem_modal")?.close()
      }
    } catch (_error) {
      setRedeemError(t("redeem.errors.generic"))
    } finally {
      setRedeemLoading(false)
    }
  }

  const handleAddChild = async () => {
    if (!sequencedId.trim()) {
      setAddChildError(t("addChild.errors.emptyId"))
      return
    }

    setAddChildLoading(true)
    setAddChildError("")
    setAddChildSuccess("")

    try {
      const result = await updateCurrentUser({ children: [sequencedId] })
      if (!result.success) {
        setAddChildError(result.error || t("addChild.errors.generic"))
      } else {
        setAddChildSuccess(t("addChild.success"))
        setSequencedId("")
        const refreshed = await getChildrenData()
        if (refreshed.success) {
          setChildren(refreshed.data?.data?.children || [])
        }
      }
    } catch (_error) {
      setAddChildError(t("addChild.errors.generic"))
    } finally {
      setAddChildLoading(false)
    }
  }

  const copyCode = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      setRedeemSuccess(t("copySuccess"))
    } catch (_error) {
    }
  }

  const renderPager = (currentPage, totalPages, onChange) => {
    if (selectedChild || totalPages <= 1) return null
    const pageNumbers = getVisiblePages(currentPage, totalPages)

    return (
      <div className="mt-4 flex justify-center">
        <div className="join">
          <button type="button" className="join-item btn btn-sm" onClick={() => onChange(currentPage - 1)} disabled={currentPage === 1}>
            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          {pageNumbers.map((pageNumber) => (
            <button key={pageNumber} type="button" className={`join-item btn btn-sm ${pageNumber === currentPage ? "btn-primary" : "btn-outline"}`} onClick={() => onChange(pageNumber)}>
              {pageNumber}
            </button>
          ))}
          <button type="button" className="join-item btn btn-sm" onClick={() => onChange(currentPage + 1)} disabled={currentPage === totalPages}>
            {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    )
  }

  const summaryCards = [
    { icon: <Wallet className="h-4 w-4" />, label: t("balance.title"), value: balance, hint: t("balance.currency") },
    { icon: <TrendingUp className="h-4 w-4" />, label: t("transactions.title"), value: transactions.length, hint: t("table.type") },
    { icon: <BookOpen className="h-4 w-4" />, label: t("lectures.title"), value: lectureAccess.length, hint: t("views") },
    { icon: isParent ? <Users className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />, label: isParent ? t("children.title") : t("actions.title"), value: isParent ? children.length : userInfo?.role || t("student"), hint: selectedChildData?.name || t("title") },
  ]

  return (
    <div
      className="min-h-screen pb-12 pt-6"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ background: `${GRADIENTS.pageAtmosphere}, ${TOKENS.creamSurface}` }}
    >
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 md:px-8">
        <section className="rounded-[2rem] border p-5 md:p-7" style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}>
          <h1 className="text-3xl font-black md:text-4xl" style={{ color: TOKENS.deepTeal }}>{t("title")}</h1>
          <p className="mt-2 text-sm md:text-base" style={{ color: TOKENS.slateText }}>{t("subtitle")}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {summaryCards.map((card, index) => (
              <article key={String(index)} className="rounded-2xl border bg-white p-3" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em]" style={{ color: TOKENS.slateText }}>
                  <span className="grid h-6 w-6 place-items-center rounded-full" style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}>{card.icon}</span>
                  {card.label}
                </div>
                <p className="mt-1 text-xl font-black" style={{ color: TOKENS.inkText }}>{card.value}</p>
                <p className="text-xs" style={{ color: TOKENS.slateText }}>{card.hint}</p>
              </article>
            ))}
          </div>
          {fetchError && <div className="alert alert-error mt-4"><X className="h-5 w-5" /><span>{fetchError}</span></div>}
        </section>

        {userInfo && <ReferralSection userInfo={userInfo} onUserUpdate={updateCurrentUser} />}

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <article className="rounded-[2rem] border bg-white p-5" style={{ borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full font-bold" style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}>
                {(selectedChildData?.name || userInfo?.name || "U").charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold">{selectedChildData?.name || userInfo?.name || t("user")}</p>
                <p className="truncate text-sm" style={{ color: TOKENS.slateText }}>{selectedChildData ? t("student") : userInfo?.email}</p>
              </div>
            </div>
            {!selectedChildData && (
              <div className="mt-3 text-sm" style={{ color: TOKENS.slateText }}>
                <p>{t("profile.sequenceId")}: {userInfo?.sequencedId || "-"}</p>
                <p>{t("profile.userSerial")}: {userInfo?.userSerial || "-"}</p>
              </div>
            )}
          </article>

          {userInfo?.role === "Parent" ? (
            <article className="rounded-[2rem] border p-5 xl:col-span-2" style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}>
              <h2 className="text-xl font-extrabold" style={{ color: TOKENS.deepTeal }}>{t("addChild.title")}</h2>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input type="text" className="input input-bordered w-full" value={sequencedId} onChange={(event) => setSequencedId(event.target.value)} placeholder={t("addChild.placeholder")} />
                <button type="button" className="btn border-none text-white" style={{ background: TOKENS.deepTeal }} onClick={handleAddChild} disabled={addChildLoading}>
                  {addChildLoading ? <span className="loading loading-spinner loading-sm"></span> : t("addChild.button")}
                </button>
              </div>
              {addChildError && <div className="alert alert-error mt-3"><X className="h-5 w-5" /><span>{addChildError}</span></div>}
              {addChildSuccess && <div className="alert alert-success mt-3"><Check className="h-5 w-5" /><span>{addChildSuccess}</span></div>}
            </article>
          ) : (
            <article className="rounded-[2rem] border p-5 xl:col-span-2" style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}>
              <h2 className="text-xl font-extrabold" style={{ color: TOKENS.deepTeal }}>{t("actions.title")}</h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" className="btn border-none text-white" style={{ background: TOKENS.deepTeal }} onClick={startScanner} disabled={selectedChild !== null}>
                  <QrCode className="h-4 w-4" />{t("scanner.button")}
                </button>
                <button type="button" className="btn border-none text-white" style={{ background: TOKENS.warmMango }} onClick={() => document.getElementById("redeem_modal")?.showModal()} disabled={selectedChild !== null}>
                  <Ticket className="h-4 w-4" />{t("redeem.button")}
                </button>
              </div>
              {selectedChild && <div className="alert alert-info mt-3"><Info className="h-4 w-4" /><span>{t("children.actionsDisabled")}</span></div>}
            </article>
          )}
        </section>

        {isParent && (
          <section className="rounded-[2rem] border p-5" style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}>
            <h2 className="mb-3 text-xl font-extrabold" style={{ color: TOKENS.deepTeal }}>{t("children.title")}</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={`btn ${!selectedChild ? "btn-primary" : "btn-outline"}`} onClick={() => { setSelectedChild(null); setActiveTab("transactions") }}>
                <UserCircle2 className="h-4 w-4" />{t("children.yourAccount")}
              </button>
              {children.map((child) => (
                <button key={child._id} type="button" className={`btn ${selectedChild === child._id ? "btn-primary" : "btn-outline"}`} onClick={() => { setSelectedChild(child._id); setActiveTab("transactions") }}>
                  <User className="h-4 w-4" />{child.name}
                </button>
              ))}
            </div>
            {childrenLoading && <div className="mt-3"><span className="loading loading-spinner loading-md"></span></div>}
            {selectedChildData && (
              <div className="mt-3 rounded-xl border bg-white p-3" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
                <p className="font-bold">{selectedChildData.name}</p>
                <p className="text-sm" style={{ color: TOKENS.slateText }}>{selectedChildData.level?.name || "-"}</p>
                <p className="text-sm" style={{ color: TOKENS.slateText }}>{selectedChildData.faction || "-"}</p>
              </div>
            )}
          </section>
        )}

        {!selectedChild && (
          <section className="rounded-[2rem] border p-5" style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}>
            <h2 className="mb-3 text-xl font-extrabold" style={{ color: TOKENS.deepTeal }}>{t("lecturerPoints.title")}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {pointsBalances.map((item, index) => (
                <article key={`${item?.lecturer?._id || "general"}-${index}`} className="rounded-xl border bg-white p-3" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
                  <p className="truncate text-sm">{item.lecturer ? item.lecturer.name : t("generalPoints")}</p>
                  <p className="text-xl font-black" style={{ color: TOKENS.deepTeal }}>{item.points}</p>
                  <p className="text-xs" style={{ color: TOKENS.slateText }}>{t("balance.currency")}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-[2rem] border p-3 md:p-4" style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}>
          <div className="tabs tabs-boxed mb-4 rounded-xl bg-white p-2">
            <button type="button" className={`tab ${activeTab === "transactions" ? "tab-active" : ""}`} onClick={() => setActiveTab("transactions")}>
              {selectedChildData ? `${selectedChildData.name} • ` : ""}{t("transactions.title")}
            </button>
            <button type="button" className={`tab ${activeTab === "lectures" ? "tab-active" : ""}`} onClick={() => setActiveTab("lectures")}>
              {selectedChildData ? `${selectedChildData.name} • ` : ""}{t("lectures.title")}
            </button>
            {selectedChild && (
              <button type="button" className={`tab ${activeTab === "exams" ? "tab-active" : ""}`} onClick={() => setActiveTab("exams")}>
                {selectedChildData ? `${selectedChildData.name} • ` : ""}{t("exams.title")}
              </button>
            )}
          </div>

          <div className="rounded-xl bg-white p-4">
            {activeTab === "transactions" && (
              <>
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead className="bg-primary/5">
                      <tr>
                        <th>{t("table.date")}</th>
                        <th>{t("table.amount")}</th>
                        <th>{t("table.teacher")}</th>
                        <th>{t("table.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!loading && transactions.map((transaction, index) => (
                        <tr key={`${transaction.id}-${index}`}>
                          <td>{transaction.createdAt}</td>
                          <td style={{ color: transaction.isRedemption ? "#16A34A" : "#DC2626" }}>
                            {transaction.isRedemption ? `+${transaction.amount}` : `-${transaction.amount}`}
                          </td>
                          <td>{transaction.instructorName}</td>
                          <td>
                            {transaction.isRedemption && (
                              <button type="button" className="btn btn-ghost btn-xs" onClick={() => copyCode(transaction.code)}>
                                <Copy className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {loading && (
                        <tr>
                          <td colSpan={4} className="text-center py-10">
                            <span className="loading loading-spinner loading-lg"></span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPager(transactionsPage, transactionsTotalPages, setTransactionsPage)}
              </>
            )}

            {activeTab === "lectures" && (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {!loading && lectureAccess.map((access, index) => (
                    <article key={`${access?.lecture?._id || "lecture"}-${index}`} className="rounded-xl border p-3" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
                      <p className="font-bold">{access.lecture?.name || "-"}</p>
                      <p className="text-sm" style={{ color: TOKENS.slateText }}>{access.lecture?.description || t("noDescription")}</p>
                      <p className="text-xs mt-1" style={{ color: TOKENS.slateText }}>{access.remainingViews} {t("views")}</p>
                    </article>
                  ))}
                  {loading && <div className="col-span-full text-center py-10"><span className="loading loading-spinner loading-lg"></span></div>}
                </div>
                {renderPager(lecturesPage, lectureAccessTotalPages, setLecturesPage)}
              </>
            )}

            {activeTab === "exams" && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {examScores.map((exam, index) => (
                  <article key={`${exam?.lecture?._id || "exam"}-${index}`} className="rounded-xl border p-3" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
                    <p className="font-bold">{exam.lecture?.name || "-"}</p>
                    <p className="text-sm">{t("exams.score")}: {exam.score}/{exam.maxScore}</p>
                    <p className={`text-xs font-semibold ${exam.passed ? "text-green-600" : "text-red-600"}`}>
                      {exam.passed ? t("exams.passed") : t("exams.failed")}
                    </p>
                  </article>
                ))}
                {examScores.length === 0 && (
                  <div className="col-span-full text-center py-10" style={{ color: TOKENS.slateText }}>
                    {t("exams.noExams")}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      <dialog id="scanner_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box max-w-md rounded-[1.5rem]">
          <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" onClick={stopScanner}>
            <X className="h-4 w-4" />
          </button>
          <div className="mb-3 flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            <h3 className="font-bold">{t("scanner.title")}</h3>
          </div>
          {scannerError && <div className="alert alert-error mb-3"><X className="h-4 w-4" /><span>{scannerError}</span></div>}
          {scannerLoading && <div className="mb-3"><span className="loading loading-spinner loading-lg"></span></div>}
          <div id="qr-reader" className="w-full overflow-hidden rounded-xl border-2" style={{ borderColor: "rgba(14,85,99,0.2)" }} />
        </div>
        <form method="dialog" className="modal-backdrop"><button type="button" onClick={stopScanner}>close</button></form>
      </dialog>

      <dialog id="redeem_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box max-w-md rounded-[1.5rem]">
          <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3">
            <X className="h-4 w-4" />
          </button>
          <div className="mb-3 flex items-center gap-2">
            <Gift className="h-5 w-5" />
            <h3 className="font-bold">{t("redeem.modalTitle")}</h3>
          </div>
          <div className="relative">
            <input type="text" className="input input-bordered w-full pe-10" value={redeemCode} onChange={(event) => setRedeemCode(event.target.value)} placeholder={t("redeem.placeholder")} dir={isRTL ? "rtl" : "ltr"} />
            <span className="pointer-events-none absolute inset-y-0 end-3 grid place-items-center text-base-content/40"><Search className="h-4 w-4" /></span>
          </div>
          {redeemError && <div className="alert alert-error mt-3"><X className="h-4 w-4" /><span>{redeemError}</span></div>}
          {redeemSuccess && <div className="alert alert-success mt-3"><Check className="h-4 w-4" /><span>{redeemSuccess}</span></div>}
          <button type="button" className="btn mt-4 w-full border-none text-white" style={{ background: TOKENS.deepTeal }} onClick={handleRedeem} disabled={redeemLoading}>
            {redeemLoading ? <span className="loading loading-spinner loading-sm"></span> : <><Ticket className="h-4 w-4" />{t("redeem.button")}</>}
          </button>
        </div>
        <form method="dialog" className="modal-backdrop"><button type="button">close</button></form>
      </dialog>
    </div>
  )
}

export default PromoCodes
