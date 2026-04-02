"use client"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Html5Qrcode } from "html5-qrcode"
import { Award, BookOpen, Check, ChevronLeft, ChevronRight, Copy, Gift, Info, QrCode, Search, Ticket, Users, Wallet, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { designTokens } from "../../constants/designTokens"
import { getToken, getUserDashboard } from "../../routes/auth-services"
import { getChildrenData } from "../../routes/parents"
import { redeemPromoCode } from "../../routes/codes"
import { updateCurrentUser } from "../../routes/update-user"
import ReferralSection from "./ReferralSection"
import { combineTransactionsByNewest, mapPurchaseHistoryTransactions, mapRedeemedCodesForChild, mapRedeemedCodesForDashboard } from "./promoCodes.utils"

const TOKENS = designTokens.colors
const SHADOWS = designTokens.shadows
const GRADIENTS = designTokens.gradients

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
  const [redeemError, setRedeemError] = useState("")
  const [redeemSuccess, setRedeemSuccess] = useState("")
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("transactions")
  const [isParent, setIsParent] = useState(false)
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [childrenLoading, setChildrenLoading] = useState(false)
  const [sequencedId, setSequencedId] = useState("")
  const [addChildLoading, setAddChildLoading] = useState(false)
  const [addChildError, setAddChildError] = useState("")
  const [addChildSuccess, setAddChildSuccess] = useState("")
  const [userInfo, setUserInfo] = useState(null)
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [lecturesPage, setLecturesPage] = useState(1)
  const [transactionsTotalPages, setTransactionsTotalPages] = useState(1)
  const [lectureAccessTotalPages, setLectureAccessTotalPages] = useState(1)
  const [scannerLoading, setScannerLoading] = useState(false)
  const [scannerError, setScannerError] = useState("")
  const scannerRef = useRef(null)
  const runningRef = useRef(false)

  useEffect(() => { if (!accessToken) navigate("/login") }, [accessToken, navigate])

  useEffect(() => {
    const load = async () => {
      setLoading(true); setFetchError("")
      try {
        const page = activeTab === "transactions" ? transactionsPage : lecturesPage
        const res = await getUserDashboard({ page, limit: 10 })
        if (!res.success) { setFetchError(res.error || t("errors.fetchFailed")); return }
        const d = res.data?.data || {}
        setUserInfo(d.userInfo); setBalance(d.userInfo?.totalPoints || 0); setIsParent(d.userInfo?.role === "Parent")
        if (!selectedChild) {
          const a = mapRedeemedCodesForDashboard({ redeemedCodes: d.redeemedCodes, pointsBalances: d.pointsBalances, t, language: i18n.language })
          const b = mapPurchaseHistoryTransactions({ purchaseHistory: d.purchaseHistory, t, language: i18n.language })
          setTransactions(combineTransactionsByNewest(a, b)); setPointsBalances(d.pointsBalances || []); setLectureAccess(d.lectureAccess || [])
          setTransactionsTotalPages(Math.max(d.paginationInfo?.purchaseHistory?.totalPages || 1, d.paginationInfo?.redeemedCodes?.totalPages || 1))
          setLectureAccessTotalPages(d.paginationInfo?.lectureAccess?.totalPages || 1)
        }
      } catch { setFetchError(t("errors.fetchFailed")) } finally { setLoading(false) }
    }
    load()
  }, [activeTab, transactionsPage, lecturesPage, selectedChild, redeemSuccess, t, i18n.language])

  useEffect(() => {
    const loadChildren = async () => {
      if (!isParent) return
      setChildrenLoading(true)
      try { const res = await getChildrenData(); if (res.success) setChildren(res.data?.data?.children || []) } finally { setChildrenLoading(false) }
    }
    loadChildren()
  }, [isParent])

  useEffect(() => {
    if (!selectedChild) { setExamScores([]); if (activeTab === "exams") setActiveTab("transactions"); return }
    const child = children.find((c) => c._id === selectedChild); if (!child) return
    setBalance(child.totalPoints || 0)
    const a = mapRedeemedCodesForChild({ redeemedCodes: child.redeemedCodes, t, language: i18n.language })
    const b = mapPurchaseHistoryTransactions({ purchaseHistory: child.purchaseHistory, t, language: i18n.language })
    setTransactions(combineTransactionsByNewest(a, b)); setLectureAccess(child.lectureAccess || []); setExamScores(child.examScores || [])
    setTransactionsTotalPages(1); setLectureAccessTotalPages(1)
  }, [selectedChild, children, t, i18n.language, activeTab])

  useEffect(() => { if (!addChildSuccess) return; const id = setTimeout(() => setAddChildSuccess(""), 3000); return () => clearTimeout(id) }, [addChildSuccess])
  const selectedChildData = children.find((c) => c._id === selectedChild) || null
  const pages = (cur, total) => Array.from({ length: Math.min(total, 5) }, (_, i) => total <= 5 ? i + 1 : cur <= 3 ? i + 1 : cur >= total - 2 ? total - 4 + i : cur - 2 + i)

  const stopScanner = async () => { if (scannerRef.current && runningRef.current) try { await scannerRef.current.stop() } catch {} runningRef.current = false; scannerRef.current = null; setScannerLoading(false) }
  const scanSuccess = async (txt) => { await stopScanner(); document.getElementById("scanner_modal")?.close(); let code = txt; try { const p = JSON.parse(txt); if (p?.code) code = p.code } catch {} setRedeemCode(code); document.getElementById("redeem_modal")?.showModal() }
  const startScanner = () => {
    setScannerError(""); setScannerLoading(true); document.getElementById("redeem_modal")?.close(); document.getElementById("scanner_modal")?.showModal()
    setTimeout(() => { try { const s = new Html5Qrcode("qr-reader"); scannerRef.current = s; s.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 240, height: 240 } }, scanSuccess, () => {}).then(() => { runningRef.current = true; setScannerLoading(false) }).catch(() => { setScannerError(t("scanner.errors.cameraPermission")); setScannerLoading(false) }) } catch { setScannerError(t("scanner.errors.initFailed")); setScannerLoading(false) } }, 300)
  }

  const redeem = async () => {
    if (!redeemCode.trim()) return setRedeemError(t("redeem.errors.emptyCode"))
    if (selectedChild) return setRedeemError(t("redeem.errors.childSelected"))
    setRedeemLoading(true); setRedeemError(""); setRedeemSuccess("")
    try { const res = await redeemPromoCode(redeemCode); if (res.success) { setRedeemSuccess(t("redeem.success")); setRedeemCode(""); setTransactionsPage(1); document.getElementById("redeem_modal")?.close() } else setRedeemError(res.error || t("redeem.errors.generic")) } catch { setRedeemError(t("redeem.errors.generic")) } finally { setRedeemLoading(false) }
  }

  const addChild = async () => {
    if (!sequencedId.trim()) return setAddChildError(t("addChild.errors.emptyId"))
    setAddChildLoading(true); setAddChildError(""); setAddChildSuccess("")
    try { const res = await updateCurrentUser({ children: [sequencedId] }); if (!res.success) setAddChildError(res.error || t("addChild.errors.generic")); else { setAddChildSuccess(t("addChild.success")); setSequencedId(""); const c = await getChildrenData(); if (c.success) setChildren(c.data?.data?.children || []) } } catch { setAddChildError(t("addChild.errors.generic")) } finally { setAddChildLoading(false) }
  }

  return (
    <div className="min-h-screen pb-10 pt-6" dir={isRTL ? "rtl" : "ltr"} style={{ background: `${GRADIENTS.pageAtmosphere}, ${TOKENS.creamSurface}` }}>
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 md:px-8">
        <section className="rounded-[2rem] border p-5 md:p-7" style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}>
          <h1 className="text-3xl font-black md:text-4xl" style={{ color: TOKENS.deepTeal }}>{t("title")}</h1>
          <p className="mt-2 text-sm md:text-base" style={{ color: TOKENS.slateText }}>{t("subtitle")}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{[
            [<Wallet className="h-4 w-4" />, t("balance.title"), balance, t("balance.currency")],
            [<BookOpen className="h-4 w-4" />, t("transactions.title"), transactions.length, t("table.type")],
            [<BookOpen className="h-4 w-4" />, t("lectures.title"), lectureAccess.length, t("views")],
            [<Users className="h-4 w-4" />, isParent ? t("children.title") : t("actions.title"), isParent ? children.length : userInfo?.role || t("student"), selectedChildData?.name || t("title")],
          ].map(([i, l, v, h], idx) => <article key={idx} className="rounded-2xl border bg-white p-3" style={{ borderColor: "rgba(17,24,39,0.08)" }}><div className="inline-flex items-center gap-2 text-xs font-bold" style={{ color: TOKENS.slateText }}>{i}{l}</div><p className="text-xl font-black">{v}</p><p className="text-xs" style={{ color: TOKENS.slateText }}>{h}</p></article>)}</div>
          {fetchError && <div className="alert alert-error mt-4"><X className="h-5 w-5" /><span>{fetchError}</span></div>}
        </section>

        {userInfo && <ReferralSection userInfo={userInfo} onUserUpdate={updateCurrentUser} />}

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <article className="rounded-[2rem] border bg-white p-5" style={{ borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}>
            <p className="font-bold">{selectedChildData?.name || userInfo?.name || t("user")}</p>
            <p className="text-sm" style={{ color: TOKENS.slateText }}>{selectedChildData ? t("student") : userInfo?.email}</p>
            {!selectedChildData && <p className="mt-2 text-sm" style={{ color: TOKENS.slateText }}>{t("profile.sequenceId")}: {userInfo?.sequencedId || "-"}</p>}
          </article>
          {userInfo?.role === "Parent" ? (
            <article className="rounded-[2rem] border p-5 xl:col-span-2" style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}>
              <h2 className="text-xl font-extrabold" style={{ color: TOKENS.deepTeal }}>{t("addChild.title")}</h2>
              <div className="mt-3 flex gap-2"><input type="text" className="input input-bordered w-full" value={sequencedId} onChange={(e) => setSequencedId(e.target.value)} placeholder={t("addChild.placeholder")} /><button type="button" className="btn border-none text-white" style={{ background: TOKENS.deepTeal }} onClick={addChild} disabled={addChildLoading}>{addChildLoading ? <span className="loading loading-spinner loading-sm"></span> : t("addChild.button")}</button></div>
              {addChildError && <div className="alert alert-error mt-3"><X className="h-5 w-5" /><span>{addChildError}</span></div>}
              {addChildSuccess && <div className="alert alert-success mt-3"><Check className="h-5 w-5" /><span>{addChildSuccess}</span></div>}
            </article>
          ) : (
            <article className="rounded-[2rem] border p-5 xl:col-span-2" style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}>
              <h2 className="text-xl font-extrabold" style={{ color: TOKENS.deepTeal }}>{t("actions.title")}</h2>
              <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" className="btn border-none text-white" style={{ background: TOKENS.deepTeal }} onClick={startScanner} disabled={selectedChild !== null}><QrCode className="h-4 w-4" />{t("scanner.button")}</button><button type="button" className="btn border-none text-white" style={{ background: TOKENS.warmMango }} onClick={() => document.getElementById("redeem_modal")?.showModal()} disabled={selectedChild !== null}><Ticket className="h-4 w-4" />{t("redeem.button")}</button></div>
            </article>
          )}
        </section>

        {isParent && <section className="rounded-[2rem] border p-5" style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}><div className="mb-3 flex flex-wrap gap-2"><button type="button" className={"btn " + (!selectedChild ? "btn-primary" : "btn-outline")} onClick={() => { setSelectedChild(null); setActiveTab("transactions") }}>{t("children.yourAccount")}</button>{children.map((c) => <button key={c._id} type="button" className={"btn " + (selectedChild === c._id ? "btn-primary" : "btn-outline")} onClick={() => { setSelectedChild(c._id); setActiveTab("transactions") }}>{c.name}</button>)}</div>{childrenLoading && <span className="loading loading-spinner loading-md"></span>}</section>}

        {!selectedChild && <section className="rounded-[2rem] border p-5" style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}><h2 className="mb-3 text-xl font-extrabold" style={{ color: TOKENS.deepTeal }}>{t("lecturerPoints.title")}</h2><div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">{pointsBalances.map((i, idx) => <article key={idx} className="rounded-xl border bg-white p-3" style={{ borderColor: "rgba(17,24,39,0.08)" }}><p className="truncate text-sm">{i.lecturer ? i.lecturer.name : t("generalPoints")}</p><p className="text-xl font-black" style={{ color: TOKENS.deepTeal }}>{i.points}</p></article>)}</div></section>}

        <section className="rounded-[2rem] border p-3" style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}>
          <div className="tabs tabs-boxed mb-4 rounded-xl bg-white p-2"><button type="button" className={"tab " + (activeTab === "transactions" ? "tab-active" : "")} onClick={() => setActiveTab("transactions")}>{t("transactions.title")}</button><button type="button" className={"tab " + (activeTab === "lectures" ? "tab-active" : "")} onClick={() => setActiveTab("lectures")}>{t("lectures.title")}</button>{selectedChild && <button type="button" className={"tab " + (activeTab === "exams" ? "tab-active" : "")} onClick={() => setActiveTab("exams")}>{t("exams.title")}</button>}</div>
          <div className="rounded-xl bg-white p-4">
            {activeTab === "transactions" && <div className="overflow-x-auto"><table className="table w-full"><thead><tr><th>{t("table.date")}</th><th>{t("table.amount")}</th><th>{t("table.teacher")}</th><th>{t("table.actions")}</th></tr></thead><tbody>{!loading && transactions.map((tr, idx) => <tr key={tr.id + idx}><td>{tr.createdAt}</td><td style={{ color: tr.isRedemption ? "#16A34A" : "#DC2626" }}>{tr.isRedemption ? `+${tr.amount}` : `-${tr.amount}`}</td><td>{tr.instructorName}</td><td>{tr.isRedemption && <button type="button" className="btn btn-ghost btn-xs" onClick={() => navigator.clipboard.writeText(tr.code)}><Copy className="h-4 w-4" /></button>}</td></tr>)}{loading && <tr><td colSpan={4}><span className="loading loading-spinner loading-lg"></span></td></tr>}</tbody></table></div>}
            {activeTab === "lectures" && <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{!loading && lectureAccess.map((l, idx) => <article key={idx} className="rounded-xl border p-3"><p className="font-bold">{l.lecture.name}</p><p className="text-xs" style={{ color: TOKENS.slateText }}>{l.remainingViews} {t("views")}</p></article>)}{loading && <span className="loading loading-spinner loading-lg"></span>}</div>}
            {activeTab === "exams" && <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{!loading && examScores.map((e, idx) => <article key={idx} className="rounded-xl border p-3"><p className="font-bold">{e.lecture.name}</p><p>{t("exams.score")}: {e.score}/{e.maxScore}</p><p className={e.passed ? "text-green-600" : "text-red-600"}>{e.passed ? t("exams.passed") : t("exams.failed")}</p></article>)}</div>}
            {activeTab === "transactions" && !selectedChild && transactionsTotalPages > 1 && <div className="mt-4 flex justify-center gap-1">{pages(transactionsPage, transactionsTotalPages).map((p) => <button key={p} type="button" className={"btn btn-sm " + (p === transactionsPage ? "btn-primary" : "btn-outline")} onClick={() => setTransactionsPage(p)}>{p}</button>)}</div>}
            {activeTab === "lectures" && !selectedChild && lectureAccessTotalPages > 1 && <div className="mt-4 flex justify-center gap-1">{pages(lecturesPage, lectureAccessTotalPages).map((p) => <button key={p} type="button" className={"btn btn-sm " + (p === lecturesPage ? "btn-primary" : "btn-outline")} onClick={() => setLecturesPage(p)}>{p}</button>)}</div>}
          </div>
        </section>
      </div>

      <dialog id="scanner_modal" className="modal modal-bottom sm:modal-middle"><div className="modal-box max-w-md rounded-[1.5rem]"><button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" onClick={stopScanner}><X className="h-4 w-4" /></button><div className="mb-3 flex items-center gap-2"><QrCode className="h-5 w-5" /><h3 className="font-bold">{t("scanner.title")}</h3></div>{scannerError && <div className="alert alert-error mb-3"><X className="h-4 w-4" /><span>{scannerError}</span></div>}{scannerLoading && <span className="loading loading-spinner loading-lg"></span>}<div id="qr-reader" className="w-full overflow-hidden rounded-xl border-2" style={{ borderColor: "rgba(14,85,99,0.2)" }} /></div><form method="dialog" className="modal-backdrop"><button type="button" onClick={stopScanner}>close</button></form></dialog>
      <dialog id="redeem_modal" className="modal modal-bottom sm:modal-middle"><div className="modal-box max-w-md rounded-[1.5rem]"><button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"><X className="h-4 w-4" /></button><div className="mb-3 flex items-center gap-2"><Gift className="h-5 w-5" /><h3 className="font-bold">{t("redeem.modalTitle")}</h3></div><div className="relative"><input type="text" className="input input-bordered w-full pe-10" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)} placeholder={t("redeem.placeholder")} dir={isRTL ? "rtl" : "ltr"} /><span className="pointer-events-none absolute inset-y-0 end-3 grid place-items-center text-base-content/40"><Search className="h-4 w-4" /></span></div>{redeemError && <div className="alert alert-error mt-3"><X className="h-4 w-4" /><span>{redeemError}</span></div>}{redeemSuccess && <div className="alert alert-success mt-3"><Check className="h-4 w-4" /><span>{redeemSuccess}</span></div>}<button type="button" className="btn mt-4 w-full border-none text-white" style={{ background: TOKENS.deepTeal }} onClick={redeem} disabled={redeemLoading}>{redeemLoading ? <span className="loading loading-spinner loading-sm"></span> : <><Ticket className="h-4 w-4" />{t("redeem.button")}</>}</button></div><form method="dialog" className="modal-backdrop"><button type="button">close</button></form></dialog>
    </div>
  )
}

export default PromoCodes
