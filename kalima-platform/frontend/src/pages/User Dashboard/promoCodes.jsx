"use client"

import { useEffect, useMemo, useRef, useState, memo } from "react"
import { useTranslation } from "react-i18next"
import { Html5Qrcode } from "html5-qrcode"
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Gift,
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
import { translateErrorMessage } from "../../utils/errorTranslator"
import ReferralSection from "./ReferralSection"
import Button from "../../components/ui/Button"
import Input from "../../components/ui/Input"
import Modal from "../../components/ui/Modal"
import Tabs from "../../components/ui/Tabs"
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

// ─── Memoized Sub-components ──────────────────────────────────────────────────────

const SummaryCards = memo(({ cards }) => (
  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
    {cards.map((card, index) => (
      <article key={String(index)} className="rounded-2xl border bg-white p-4 transition-all duration-200 hover:shadow-sm" style={{ borderColor: TOKENS.borderSubtle }}>
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: TOKENS.slateText }}>
          <span className="grid h-6 w-6 place-items-center rounded-full" style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}>{card.icon}</span>
          {card.label}
        </div>
        <p className="mt-2 text-2xl font-black" style={{ color: TOKENS.inkText }}>{card.value}</p>
          <p className="text-xs font-medium text-slate-600">{card.hint}</p>
      </article>
    ))}
  </div>
))

const UserIdentitySection = memo(({ userInfo, selectedChildData, isParent, onAddChild, addChildLoading, addChildError, addChildSuccess, sequencedId, setSequencedId, onStartScanner, onOpenRedeem, selectedChild, t }) => (
  <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
    <article className="rounded-[2rem] border bg-white p-6" style={{ borderColor: TOKENS.borderSubtle, boxShadow: SHADOWS.level1 }}>
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-full text-lg font-black" style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}>
          {(selectedChildData?.name || userInfo?.name || "U").charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-black" style={{ color: TOKENS.inkText }}>{selectedChildData?.name || userInfo?.name || t("user")}</p>
          <p className="truncate text-sm font-medium" style={{ color: TOKENS.slateText }}>{selectedChildData ? t("student") : userInfo?.email}</p>
        </div>
      </div>
      {!selectedChildData && (
        <div className="mt-4 space-y-1 text-sm font-medium" style={{ color: TOKENS.slateText }}>
          <p className="flex items-center gap-2">
            <span className="opacity-60">{t("profile.sequenceId")}:</span> {userInfo?.sequencedId || "-"}
          </p>
          <p className="flex items-center gap-2">
            <span className="opacity-60">{t("profile.userSerial")}:</span> {userInfo?.userSerial || "-"}
          </p>
        </div>
      )}
    </article>

    {isParent ? (
      <article className="rounded-[2rem] border p-6 xl:col-span-2" style={{ background: TOKENS.neutralCloud, borderColor: TOKENS.borderSubtle, boxShadow: SHADOWS.level1 }}>
        <h2 className="text-xl font-black" style={{ color: TOKENS.deepTeal }}>{t("addChild.title")}</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Input 
            type="text" 
            className="w-full rounded-full" 
            value={sequencedId} 
            onChange={(event) => setSequencedId(event.target.value)} 
            placeholder={t("addChild.placeholder")} 
          />
          <Button 
            variant="primary" 
            className="rounded-full px-8" 
            onClick={onAddChild} 
            isDisabled={addChildLoading} 
            isLoading={addChildLoading}
          >
            {t("addChild.button")}
          </Button>
        </div>
        {addChildError && <div className="flex items-center gap-3 p-3 mt-4 rounded-xl bg-error/10 text-error border border-error/20"><X className="h-4 w-4" /><span>{addChildError}</span></div>}
        {addChildSuccess && <div className="flex items-center gap-3 p-3 mt-4 rounded-xl bg-success/10 text-success border border-success/20"><Check className="h-4 w-4" /><span>{addChildSuccess}</span></div>}

      </article>
    ) : (
      <article className="rounded-[2rem] border p-6 xl:col-span-2" style={{ background: TOKENS.neutralCloud, borderColor: TOKENS.borderSubtle, boxShadow: SHADOWS.level1 }}>
        <h2 className="text-xl font-black" style={{ color: TOKENS.deepTeal }}>{t("actions.title")}</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button 
            variant="primary" 
            className="rounded-full" 
            onClick={onStartScanner} 
            isDisabled={selectedChild !== null}
          >
            <QrCode className="h-4 w-4 mr-2" />{t("scanner.button")}
          </Button>
          <Button 
            variant="primary" 
            className="rounded-full" 
            onClick={onOpenRedeem} 
            isDisabled={selectedChild !== null}
            style={{ background: TOKENS.warmMango }}
          >
            <Ticket className="h-4 w-4 mr-2" />{t("redeem.button")}
          </Button>

        </div>
        {selectedChild && <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-info/10 text-info border border-info/20"><Info className="h-4 w-4" /><span>{t("children.actionsDisabled")}</span></div>}

      </article>
    )}
  </section>
))

const ChildSelector = memo(({ isParent, children, selectedChild, onSelectChild, childrenLoading, selectedChildData, t }) => {
  if (!isParent) return null
  return (
    <section className="rounded-[2rem] border p-6" style={{ background: TOKENS.neutralCloud, borderColor: TOKENS.borderSubtle, boxShadow: SHADOWS.level1 }}>
      <h2 className="mb-4 text-xl font-black" style={{ color: TOKENS.deepTeal }}>{t("children.title")}</h2>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={!selectedChild ? "primary" : "outline"} 
            className="rounded-full px-5" 
            onClick={() => onSelectChild(null)}
          >
            <UserCircle2 className="h-4 w-4 mr-2" />{t("children.yourAccount")}
          </Button>
          {children.map((child) => (
            <Button 
              key={child._id} 
              variant={selectedChild === child._id ? "primary" : "outline"} 
              className="rounded-full px-5" 
              onClick={() => onSelectChild(child._id)}
            >
              <User className="h-4 w-4 mr-2" />{child.name}
            </Button>
          ))}
        </div>
        {childrenLoading && <div className="mt-4 flex justify-center"><div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: TOKENS.deepTeal }}></div></div>}

      {selectedChildData && (
        <div className="mt-4 rounded-2xl border bg-white p-4 transition-all" style={{ borderColor: TOKENS.borderSubtle }}>
          <p className="font-black text-lg">{selectedChildData.name}</p>
          <div className="mt-1 space-y-0.5">
            <p className="text-sm font-medium" style={{ color: TOKENS.slateText }}>{selectedChildData.level?.name || "-"}</p>
            <p className="text-sm font-medium" style={{ color: TOKENS.slateText }}>{selectedChildData.faction || "-"}</p>
          </div>
        </div>
      )}
    </section>
  )
})

const PointsBalanceSection = memo(({ pointsBalances, t }) => {
  if (pointsBalances.length === 0) return null
  return (
    <section className="rounded-[2rem] border p-5" style={{ background: TOKENS.neutralCloud, borderColor: TOKENS.borderSubtle, boxShadow: SHADOWS.level1 }}>
      <h2 className="mb-3 text-xl font-extrabold" style={{ color: TOKENS.deepTeal }}>{t("lecturerPoints.title")}</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {pointsBalances.map((item, index) => (
          <article key={`${item?.lecturer?._id || "general"}-${index}`} className="rounded-xl border bg-white p-3" style={{ borderColor: TOKENS.borderSubtle }}>
            <p className="truncate text-sm">{item.lecturer ? item.lecturer.name : t("generalPoints")}</p>
            <p className="text-xl font-black" style={{ color: TOKENS.deepTeal }}>{item.points}</p>
            <p className="text-xs" style={{ color: TOKENS.slateText }}>{t("balance.currency")}</p>
          </article>
        ))}
      </div>
    </section>
  )
})







const Pager = memo(({ currentPage, totalPages, onChange, isRTL }) => {
  if (totalPages <= 1) return null
  const pageNumbers = getVisiblePages(currentPage, totalPages)
  
  return (
      <div className="mt-6 flex justify-center">
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-l-full" 
            onClick={() => onChange(currentPage - 1)} 
            isDisabled={currentPage === 1}
          >
            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          {pageNumbers.map((pageNumber) => (
            <Button 
              key={pageNumber} 
              variant={pageNumber === currentPage ? "primary" : "outline"} 
              size="sm" 
              onClick={() => onChange(pageNumber)}
            >
              {pageNumber}
            </Button>
          ))}
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-r-full" 
            onClick={() => onChange(currentPage + 1)} 
            isDisabled={currentPage === totalPages}
          >
            {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
        </div>
      )
    })




const TransactionsTable = memo(({ transactions, loading, t, isRTL, onCopyCode }) => (
  <>
    <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-sm font-bold uppercase tracking-wider" style={{ color: TOKENS.slateText }}>
                <th className="rounded-l-xl bg-primary/5 py-3 text-start pl-4">{t("table.date")}</th>
                <th className="bg-primary/5 py-3 text-start pl-4">{t("table.amount")}</th>
                <th className="bg-primary/5 py-3 text-start pl-4">{t("table.teacher")}</th>
                <th className="rounded-r-xl bg-primary/5 py-3 text-center">{t("table.actions")}</th>
              </tr>
            </thead>
        <tbody>
          {!loading && transactions.map((transaction, index) => (
            <tr key={`${transaction.id}-${index}`} className="group hover:bg-black/[0.01] transition-colors">
              <td className="rounded-l-xl border-y border-l p-4" style={{ borderColor: TOKENS.borderSubtle }}>{transaction.createdAt}</td>
              <td className="border-y p-4 font-bold" style={{ borderColor: TOKENS.borderSubtle, color: transaction.isRedemption ? TOKENS.success : TOKENS.error }}>
                {transaction.isRedemption ? `+${transaction.amount}` : `-${transaction.amount}`}
              </td>
              <td className="border-y p-4 font-medium" style={{ borderColor: TOKENS.borderSubtle }}>{transaction.instructorName}</td>
              <td className="rounded-r-xl border-y border-r p-4 text-center" style={{ borderColor: TOKENS.borderSubtle }}>
                {transaction.isRedemption && (
                      <Button 
                        variant="ghost" 
                        size="xs" 
                        className="rounded-full hover:bg-primary/10" 
                        onClick={() => onCopyCode(transaction.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                )}
              </td>
            </tr>
          ))}
          {loading && (
            <tr>
              <td colSpan={4} className="text-center py-16">
                <div className="w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin mx-auto" style={{ color: TOKENS.deepTeal }}></div>
              </td>
            </tr>

          )}
        </tbody>
      </table>
    </div>
  </>
))

const LecturesGrid = memo(({ lectureAccess, loading, t }) => (
  <>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {!loading && lectureAccess.map((access, index) => (
        <article key={`${access?.lecture?._id || "lecture"}-${index}`} className="rounded-2xl border p-4 transition-all duration-200 hover:shadow-sm" style={{ borderColor: TOKENS.borderSubtle }}>
          <p className="font-black text-lg" style={{ color: TOKENS.inkText }}>{access.lecture?.name || "-"}</p>
          <p className="text-sm mt-1 line-clamp-2" style={{ color: TOKENS.slateText }}>{access.lecture?.description || t("noDescription")}</p>
          <div className="mt-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: TOKENS.deepTeal }}>
            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
            {access.remainingViews} {t("views")}
          </div>
        </article>
      ))}
      {loading && <div className="col-span-full text-center py-16"><div className="w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin mx-auto" style={{ color: TOKENS.deepTeal }}></div></div>}

    </div>
  </>
))

const ExamsGrid = memo(({ examScores, t }) => (
  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
    {examScores.map((exam, index) => (
      <article key={`${exam?.lecture?._id || "exam"}-${index}`} className="rounded-2xl border p-4 transition-all duration-200 hover:shadow-sm" style={{ borderColor: TOKENS.borderSubtle }}>
        <p className="font-black text-lg" style={{ color: TOKENS.inkText }}>{exam.lecture?.name || "-"}</p>
        <p className="text-sm font-medium mt-1" style={{ color: TOKENS.slateText }}>{t("exams.score")}: <span className="font-bold">{exam.score}/{exam.maxScore}</span></p>
        <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${exam.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
          {exam.passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {exam.passed ? t("exams.passed") : t("exams.failed")}
        </div>
      </article>
    ))}
    {examScores.length === 0 && (
      <div className="col-span-full text-center py-16" style={{ color: TOKENS.slateText }}>
        <div className="inline-flex flex-col items-center gap-2 opacity-60">
          <BookOpen className="h-10 w-10" />
          <p className="font-medium">{t("exams.noExams")}</p>
        </div>
      </div>
    )}
  </div>
))

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
  const [redeemModalOpen, setRedeemModalOpen] = useState(false)
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
          setFetchError(translateErrorMessage(result.error || t("errors.fetchFailed"), t))
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
    setRedeemModalOpen(true)
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
        setRedeemError(translateErrorMessage(result.error || t("redeem.errors.generic"), t))
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
        setAddChildError(translateErrorMessage(result.error || t("addChild.errors.generic"), t))
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
         <div className="flex gap-1">
           <Button 
             variant="outline" 
             size="sm" 
             className="rounded-l-full" 
             onClick={() => onChange(currentPage - 1)} 
             isDisabled={currentPage === 1}
           >
             {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
           </Button>
          {pageNumbers.map((pageNumber) => (
             <Button 
               key={pageNumber} 
               variant={pageNumber === currentPage ? "primary" : "outline"} 
               size="sm" 
               onClick={() => onChange(pageNumber)}
             >
               {pageNumber}
             </Button>
          ))}
           <Button 
             variant="outline" 
             size="sm" 
             className="rounded-r-full" 
             onClick={() => onChange(currentPage + 1)} 
             isDisabled={currentPage === totalPages}
           >
             {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
           </Button>
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
        <section className="rounded-[2rem] border p-6 md:p-8" style={{ background: TOKENS.neutralCloud, borderColor: TOKENS.borderSubtle, boxShadow: SHADOWS.level1 }}>
          <h1 className="text-3xl font-black md:text-4xl" style={{ color: TOKENS.deepTeal }}>{t("title")}</h1>
          <p className="mt-2 text-sm md:text-base font-medium" style={{ color: TOKENS.slateText }}>{t("subtitle")}</p>
          <SummaryCards cards={summaryCards} />
          {fetchError && <div className="flex items-center gap-3 mt-6 p-3 rounded-xl bg-error/10 text-error border border-error/20"><X className="h-4 w-4" /><span>{fetchError}</span></div>}
        </section>


        {userInfo && <ReferralSection userInfo={userInfo} onUserUpdate={updateCurrentUser} />}

        <UserIdentitySection 
          userInfo={userInfo} 
          selectedChildData={selectedChildData} 
          isParent={isParent} 
          onAddChild={handleAddChild} 
          addChildLoading={addChildLoading} 
          addChildError={addChildError} 
          addChildSuccess={addChildSuccess} 
          sequencedId={sequencedId} 
          setSequencedId={setSequencedId} 
          onStartScanner={startScanner} 
           onOpenRedeem={() => setRedeemModalOpen(true)} 
          selectedChild={selectedChild} 
          t={t} 
        />

        {isParent && (
          <ChildSelector 
            isParent={isParent} 
            children={children} 
            selectedChild={selectedChild} 
            onSelectChild={(id) => { setSelectedChild(id); setActiveTab("transactions") }} 
            childrenLoading={childrenLoading} 
            selectedChildData={selectedChildData} 
            t={t} 
          />
        )}

        {!selectedChild && (
          <PointsBalanceSection pointsBalances={pointsBalances} t={t} />
        )}

        <section className="rounded-[2rem] border p-4 md:p-6" style={{ background: TOKENS.neutralCloud, borderColor: TOKENS.borderSubtle, boxShadow: SHADOWS.level1 }}>
          <Tabs 
            tabs={[
              { id: "transactions", label: `${selectedChildData ? selectedChildData.name + " • " : ""}${t("transactions.title")}` },
              { id: "lectures", label: `${selectedChildData ? selectedChildData.name + " • " : ""}${t("lectures.title")}` },
              ...(selectedChild ? [{ id: "exams", label: `${selectedChildData ? selectedChildData.name + " • " : ""}${t("exams.title")}` }] : []),
            ]}
            activeIndex={
              activeTab === "transactions" ? 0 : 
              activeTab === "lectures" ? 1 : 
              activeTab === "exams" ? 2 : 0
            }
            onChange={(index) => {
              const tabs = ["transactions", "lectures", "exams"];
              setActiveTab(tabs[index]);
            }}
            className="mb-6"
          />


          <div className="rounded-2xl bg-white p-4 md:p-6">
            {activeTab === "transactions" && (
              <>
                <TransactionsTable 
                  transactions={transactions} 
                  loading={loading} 
                  t={t} 
                  isRTL={isRTL} 
                  onCopyCode={copyCode} 
                />
                {renderPager(transactionsPage, transactionsTotalPages, setTransactionsPage)}
              </>
            )}

            {activeTab === "lectures" && (
              <>
                <LecturesGrid lectureAccess={lectureAccess} loading={loading} t={t} />
                {renderPager(lecturesPage, lectureAccessTotalPages, setLecturesPage)}
              </>
            )}

            {activeTab === "exams" && (
              <ExamsGrid examScores={examScores} t={t} />
            )}
          </div>
        </section>
      </div>

        <Modal 
          isOpen={scannerRunningRef.current} 
          onClose={stopScanner} 
          title={t("scanner.title")}
          className="max-w-md rounded-[2rem] p-6"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}>
              <QrCode className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-black" style={{ color: TOKENS.deepTeal }}>{t("scanner.title")}</h3>
          </div>
          {scannerError && <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-error/10 text-error border border-error/20"><X className="h-4 w-4" /><span>{scannerError}</span></div>}
          {scannerLoading && <div className="mb-6 flex justify-center"><div className="w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin mx-auto" style={{ color: TOKENS.deepTeal }}></div></div>}
          <div id="qr-reader" className="w-full overflow-hidden rounded-2xl border-2" style={{ borderColor: TOKENS.deepTealSubtle }} />
        </Modal>


        <Modal 
          isOpen={redeemModalOpen} 
          onClose={() => setRedeemModalOpen(false)} 
          title={t("redeem.modalTitle")}
          className="max-w-md rounded-[2rem] p-6"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}>
              <Gift className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-black" style={{ color: TOKENS.deepTeal }}>{t("redeem.modalTitle")}</h3>
          </div>
          <div className="relative mb-6">
            <Input 
              type="text" 
              className="w-full rounded-full pe-10" 
              value={redeemCode} 
              onChange={(event) => setRedeemCode(event.target.value)} 
              placeholder={t("redeem.placeholder")} 
              dir={isRTL ? "rtl" : "ltr"} 
            />
            <span className="pointer-events-none absolute inset-y-0 end-4 grid place-items-center text-neutral/40"><Search className="h-4 w-4" /></span>
          </div>
          {redeemError && <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-error/10 text-error border border-error/20"><X className="h-4 w-4" /><span>{redeemError}</span></div>}
          {redeemSuccess && <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-success/10 text-success border border-success/20"><Check className="h-4 w-4" /><span>{redeemSuccess}</span></div>}
          <Button 
            variant="primary" 
            className="w-full rounded-full py-3 font-bold" 
            onClick={handleRedeem} 
            isDisabled={redeemLoading} 
            isLoading={redeemLoading}
          >
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              {t("redeem.button")}
            </div>
          </Button>
        </Modal>

    </div>
  )
}

export default PromoCodes
