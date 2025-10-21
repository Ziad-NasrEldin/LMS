"use client"
import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Html5Qrcode } from "html5-qrcode"
import { Wallet, Info, Ticket, QrCode, Gift, ChevronLeft, ChevronRight, Copy, Check, X, Search, Camera, RefreshCw, Users, Clock, BookOpen, BarChart3, User, GraduationCap, School, UserCircle2, Award, FileText, CheckCircle, XCircle, Calendar } from 'lucide-react'
import { getUserDashboard } from "../../routes/auth-services"
import { getChildrenData } from "../../routes/parents"
import { redeemPromoCode } from "../../routes/codes"
import { getToken } from "../../routes/auth-services"
import { updateCurrentUser } from "../../routes/update-user"
import { useNavigate } from "react-router-dom"
import ReferralSection from "./ReferralSection"

const PromoCodes = () => {
  const { t, i18n } = useTranslation("promoCodes")
  const isRTL = i18n.language === "ar"
  const [transactions, setTransactions] = useState([])
  const [pointsBalances, setPointsBalances] = useState([])
  const [lectureAccess, setLectureAccess] = useState([])
  const [examScores, setExamScores] = useState([])
  const [redeemCode, setRedeemCode] = useState("")
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemError, setRedeemError] = useState(null)
  const [redeemSuccess, setRedeemSuccess] = useState(null)
  const [fetchError, setFetchError] = useState(null)
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [lecturesPage, setLecturesPage] = useState(1)
  const [transactionsTotalPages, setTransactionsTotalPages] = useState(1)
  const [lectureAccessTotalPages, setLectureAccessTotalPages] = useState(1)
  const [limit] = useState(10)
  const [scannerActive, setScannerActive] = useState(false)
  const [scannerError, setScannerError] = useState(null)
  const [scannerLoading, setScannerLoading] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [activeTab, setActiveTab] = useState("transactions")
  const [isParent, setIsParent] = useState(false)
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [childrenLoading, setChildrenLoading] = useState(false)
  const [sequencedId, setSequencedId] = useState("")
  const [addChildLoading, setAddChildLoading] = useState(false)
  const [addChildError, setAddChildError] = useState(null)
  const [addChildSuccess, setAddChildSuccess] = useState(null)
  const navigate = useNavigate()
  const accessToken = getToken()

  useEffect(() => {
    if (!accessToken) {
      navigate("/login")
    }
  }, [accessToken, navigate])

  const scannerRef = useRef(null)
  const isRunningRef = useRef(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      setFetchError(null)
      try {
        const pageToFetch = activeTab === "transactions" ? transactionsPage : lecturesPage
        const result = await getUserDashboard({ page: pageToFetch, limit: limit })
        if (result.success) {
          const { userInfo, pointsBalances, redeemedCodes, purchaseHistory, lectureAccess, paginationInfo } =
            result.data.data || {}
          setUserInfo(userInfo)
          setBalance(userInfo?.totalPoints || 0)
          setIsParent(userInfo?.role === "Parent")

          if (!selectedChild) {
            const mappedRedeemedCodes = (redeemedCodes || []).map((code, index) => ({
              id: `code-${index + 1}`,
              type: t("transactions.types.codeRedemption"),
              code: code.code,
              amount: code.pointsAmount,
              instructorName: code.lecturerId
                ? pointsBalances?.find((b) => b.lecturer?._id === code.lecturerId)?.lecturer?.name || t("notAvailable")
                : t("generalPoints"),
              createdAt: new Date(code.redeemedAt).toLocaleString(i18n.language, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              isRedemption: true,
            }))

            const mappedPurchaseHistory = (purchaseHistory || []).map((purchase, index) => ({
              id: `purchase-${index + 1}`,
              type: t("transactions.types.coursePurchase"),
              code: purchase.description,
              amount: purchase.points,
              instructorName: purchase.lecturer?.name || t("notAvailable"),
              createdAt: new Date(purchase.purchasedAt).toLocaleString(i18n.language, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              isRedemption: false,
            }))

            const combinedTransactions = [...mappedRedeemedCodes, ...mappedPurchaseHistory].sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
            )

            setTransactions(combinedTransactions)
            setPointsBalances(pointsBalances || [])
            setLectureAccess(lectureAccess || [])

            if (paginationInfo) {
              const purchaseTotalPages = paginationInfo.purchaseHistory?.totalPages || 1
              const redeemedTotalPages = paginationInfo.redeemedCodes?.totalPages || 1
              setTransactionsTotalPages(Math.max(purchaseTotalPages, redeemedTotalPages))
              setLectureAccessTotalPages(paginationInfo.lectureAccess?.totalPages || 1)
            }
          }
        } else {
          setFetchError(result.error || t("errors.fetchFailed"))
        }
      } catch (error) {
        setFetchError(t("errors.fetchFailed"))
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [transactionsPage, lecturesPage, activeTab, limit, redeemSuccess, t, i18n.language, selectedChild])

  useEffect(() => {
    const fetchChildrenData = async () => {
      if (isParent) {
        setChildrenLoading(true)
        try {
          const result = await getChildrenData()
          if (result.success) {
            setChildren(result.data.data.children || [])
          } else {
            console.error("Failed to fetch children data:", result.error)
          }
        } catch (error) {
          console.error("Error fetching children data:", error)
        } finally {
          setChildrenLoading(false)
        }
      }
    }

    if (isParent) {
      fetchChildrenData()
    }
  }, [isParent])

  useEffect(() => {
    if (selectedChild) {
      const childData = children.find((child) => child._id === selectedChild)
      if (childData) {
        setBalance(childData.totalPoints || 0)

        const mappedRedeemedCodes = (childData.redeemedCodes || []).map((code, index) => ({
          id: `code-${index + 1}`,
          type: t("transactions.types.codeRedemption"),
          code: code.code,
          amount: code.pointsAmount,
          instructorName: code.lecturerId ? t("notAvailable") : t("generalPoints"),
          createdAt: new Date(code.redeemedAt).toLocaleString(i18n.language, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          isRedemption: true,
        }))

        const mappedPurchaseHistory = (childData.purchaseHistory || []).map((purchase, index) => ({
          id: `purchase-${index + 1}`,
          type: t("transactions.types.coursePurchase"),
          code: purchase.description,
          amount: purchase.points,
          instructorName: purchase.lecturer?.name || t("notAvailable"),
          createdAt: new Date(purchase.purchasedAt).toLocaleString(i18n.language, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          isRedemption: false,
        }))

        const combinedTransactions = [...mappedRedeemedCodes, ...mappedPurchaseHistory].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        )

        setTransactions(combinedTransactions)
        setLectureAccess(childData.lectureAccess || [])
        setExamScores(childData.examScores || [])
        setTransactionsTotalPages(1)
        setLectureAccessTotalPages(1)
      }
    } else {
      // Clear exam scores when not viewing a child
      setExamScores([])
    }
  }, [selectedChild, children, t, i18n.language])

  useEffect(() => {
    const scannerModal = document.getElementById("scanner_modal")
    const handleModalClose = () => {
      stopScanner()
    }

    if (scannerModal) {
      scannerModal.addEventListener("close", handleModalClose)
    }

    return () => {
      stopScanner()
      if (scannerModal) {
        scannerModal.removeEventListener("close", handleModalClose)
      }
    }
  }, [])

  useEffect(() => {
    if (addChildSuccess) {
      const timer = setTimeout(() => {
        setAddChildSuccess(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [addChildSuccess])

  const startScanner = () => {
    setScannerActive(true)
    setScannerError(null)
    setScannerLoading(true)
    document.getElementById("redeem_modal").close()
    document.getElementById("scanner_modal").showModal()

    setTimeout(() => {
      try {
        const scanner = new Html5Qrcode("qr-reader")
        scannerRef.current = scanner

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        }

        scanner
          .start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
          .then(() => {
            isRunningRef.current = true
            setScannerLoading(false)
          })
          .catch((err) => {
            setScannerError(t("scanner.errors.cameraPermission"))
            setScannerLoading(false)
            console.error("Error starting scanner:", err)
            scannerRef.current = null
            isRunningRef.current = false
          })
      } catch (err) {
        setScannerError(t("scanner.errors.initFailed"))
        setScannerLoading(false)
        console.error("Error initializing scanner:", err)
        scannerRef.current = null
        isRunningRef.current = false
      }
    }, 500)
  }

  const stopScanner = () => {
    if (scannerRef.current && isRunningRef.current) {
      try {
        scannerRef.current
          .stop()
          .then(() => {
          })
          .catch((err) => {
          })
          .finally(() => {
            isRunningRef.current = false
            scannerRef.current = null
            setScannerActive(false)
            setScannerLoading(false)
          })
      } catch (err) {
        isRunningRef.current = false
        scannerRef.current = null
        setScannerActive(false)
        setScannerLoading(false)
      }
    } else {
      isRunningRef.current = false
      scannerRef.current = null
      setScannerActive(false)
      setScannerLoading(false)
    }
  }

  const onScanSuccess = async (decodedText) => {
    isRunningRef.current = false
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop()
      }
    } catch (err) {
      console.log("Error stopping scanner after scan (handled):", err)
    } finally {
      scannerRef.current = null
      setScannerActive(false)
      setScannerLoading(false)
    }

    try {
      let codeToRedeem = decodedText
      try {
        const parsedData = JSON.parse(decodedText)
        if (parsedData && parsedData.code) {
          codeToRedeem = parsedData.code
        }
      } catch (e) {
        console.log("QR code is not in JSON format, using raw text")
      }

      if (navigator.vibrate) {
        navigator.vibrate(200)
      }

      document.getElementById("scanner_modal").close()
      setRedeemCode(codeToRedeem)
      setRedeemError(null)
      setRedeemSuccess(null)
      document.getElementById("redeem_modal").showModal()
    } catch (error) {
      setScannerError(t("scanner.errors.invalidCode"))
      console.error("Error processing QR code:", error)
    }
  }

  const onScanFailure = (error) => {
    console.log("QR scan error (normal during scanning):", error)
  }

  const handleRedeemCode = async () => {
    if (!redeemCode.trim()) {
      setRedeemError(t("redeem.errors.emptyCode"))
      return
    }

    setRedeemLoading(true)
    setRedeemError(null)
    setRedeemSuccess(null)

    try {
      if (selectedChild) {
        setRedeemError(
          t("redeem.errors.childSelected") || "Cannot redeem code for a child. Please select your own account.",
        )
        setRedeemLoading(false)
        return
      }

      const result = await redeemPromoCode(redeemCode)
      if (result.success) {
        setRedeemSuccess(t("redeem.success"))
        setRedeemCode("")
        setTransactionsPage(1)
        document.getElementById("redeem_modal").close()
      } else {
        setRedeemError(result.error || t("redeem.errors.generic"))
      }
    } catch (error) {
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
    setAddChildError(null)
    setAddChildSuccess(null)

    try {
      const updateData = {
        children: [sequencedId],
      }

      const result = await updateCurrentUser(updateData)
      if (result.success) {
        setAddChildSuccess(t("addChild.success"))
        setSequencedId("")
        const childrenResult = await getChildrenData()
        if (childrenResult.success) {
          setChildren(childrenResult.data.data.children || [])
        }
      } else {
        setAddChildError(result.error || t("addChild.errors.generic"))
      }
    } catch (error) {
      setAddChildError(t("addChild.errors.generic"))
    } finally {
      setAddChildLoading(false)
    }
  }

  const handleTransactionsPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= transactionsTotalPages) {
      setTransactionsPage(newPage)
    }
  }

  const handleLecturesPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= lectureAccessTotalPages) {
      setLecturesPage(newPage)
    }
  }

  const copyToClipboard = (code) => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        if (navigator.vibrate) {
          navigator.vibrate(200)
        }
        setRedeemSuccess(t("copySuccess") || "Code copied to clipboard!")
      })
      .catch((err) => {
        console.error("Failed to copy:", err)
      })
  }

  const handleChildSelect = (childId) => {
    if (childId === "parent") {
      setSelectedChild(null)
    } else {
      setSelectedChild(childId)
    }
    setTransactionsPage(1)
    setLecturesPage(1)
  }

  const renderTransactionsTab = () => (
    <div className="overflow-x-auto rounded-xl">
      <table className="table w-full">
        <thead className="bg-primary/5">
          <tr>
            <th className="rounded-tl-xl tooltip" data-tip={t("table.dateTooltip") || "When the transaction occurred"}>
              {t("table.date")} <Info className="w-3 h-3 inline-block ml-1 opacity-60" />
            </th>
            <th className="tooltip hidden md:table-cell" data-tip={t("table.typeTooltip") || "Type of transaction"}>
              {t("table.type")} <Info className="w-3 h-3 inline-block ml-1 opacity-60" />
            </th>
            <th className="tooltip" data-tip={t("table.amountTooltip") || "Points added or deducted"}>
              {t("table.amount")} <Info className="w-3 h-3 inline-block ml-1 opacity-60" />
            </th>
            <th
              className="tooltip hidden md:table-cell"
              data-tip={t("table.teacherTooltip") || "Teacher associated with these points"}
            >
              {t("table.teacher")} <Info className="w-3 h-3 inline-block ml-1 opacity-60" />
            </th>
            <th className="rounded-tr-xl">{t("table.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {!loading ? (
            transactions.length > 0 ? (
              transactions.map((transaction, index) => (
                <tr
                  key={transaction.id}
                  className={`hover:bg-base-200 ${index % 2 === 0 ? "bg-base-100" : "bg-base-100/50"}`}
                >
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10">
                        {transaction.isRedemption ? (
                          <Ticket className="w-4 h-4 text-primary" />
                        ) : (
                          <BookOpen className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{transaction.createdAt.split(",")[0]}</div>
                        <div className="text-xs opacity-70">{transaction.createdAt.split(",")[1]}</div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        transaction.isRedemption ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </td>
                  <td className="font-medium">
                    <div className="flex items-center gap-1">
                      {transaction.isRedemption ? (
                        <span className="text-green-600">+{transaction.amount}</span>
                      ) : (
                        <span className="text-red-600">{transaction.amount === 0 ? 0 : `-${transaction.amount}`}</span>
                      )}
                      <span className="md:hidden text-xs opacity-70">
                        {transaction.isRedemption ? (
                          <span className="bg-green-100 text-green-800 px-1 rounded text-[10px]">
                            {t("transactions.types.codeRedemption")}
                          </span>
                        ) : (
                          <span className="bg-blue-100 text-blue-800 px-1 rounded text-[10px]">
                            {t("transactions.types.coursePurchase")}
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="hidden md:table-cell">{transaction.instructorName}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      {transaction.isRedemption ? (
                        <button
                          onClick={() => copyToClipboard(transaction.code)}
                          className="btn btn-ghost btn-sm"
                          title={t("copy")}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      ) : (
                        <button className="btn btn-ghost btn-sm" title={t("details")}>
                          <Info className="w-4 h-4" />
                        </button>
                      )}
                      <span className="md:hidden text-xs truncate max-w-[80px]">{transaction.instructorName}</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-10">
                  <div className="flex flex-col items-center justify-center text-base-content/60">
                    <div className="bg-base-200 p-4 rounded-full mb-4">
                      <Info className="w-8 h-8 text-base-content/60" />
                    </div>
                    <p className="text-lg font-medium">{t("noData")}</p>
                  </div>
                </td>
              </tr>
            )
          ) : (
            <tr>
              <td colSpan="5" className="text-center py-10">
                <div className="flex flex-col items-center justify-center">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {!selectedChild && transactionsTotalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="join">
            <button
              className="join-item btn"
              onClick={() => handleTransactionsPageChange(transactionsPage - 1)}
              disabled={transactionsPage === 1}
            >
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            {Array.from({ length: Math.min(5, transactionsTotalPages) }).map((_, i) => {
              let pageNum
              if (transactionsTotalPages <= 5) {
                pageNum = i + 1
              } else if (transactionsPage <= 3) {
                pageNum = i + 1
              } else if (transactionsPage >= transactionsTotalPages - 2) {
                pageNum = transactionsTotalPages - 4 + i
              } else {
                pageNum = transactionsPage - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  className={`join-item btn ${transactionsPage === pageNum ? "btn-primary" : ""}`}
                  onClick={() => handleTransactionsPageChange(pageNum)}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              className="join-item btn"
              onClick={() => handleTransactionsPageChange(transactionsPage + 1)}
              disabled={transactionsPage === transactionsTotalPages}
            >
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )

  const renderLectureAccessTab = () => (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!loading ? (
          lectureAccess.length > 0 ? (
            lectureAccess.map((access, index) => (
              <div
                key={index}
                className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow"
              >
                <div className="card-body p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="card-title text-base line-clamp-1">{access.lecture.name}</h3>
                    <div className="badge badge-primary whitespace-nowrap">
                      {access.remainingViews} {t("views")}
                    </div>
                  </div>
                  <p className="text-sm opacity-70 line-clamp-2">{access.lecture.description || t("noDescription")}</p>
                  <div className="flex flex-wrap justify-between items-center mt-2 text-xs opacity-70 gap-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      {new Date(access.lastAccessed).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 flex-shrink-0" />
                      {access.lecture.numberOfViews || 0} {t("totalViews")}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-10 text-center">
              <div className="bg-base-200 p-4 rounded-full mb-4">
                <BookOpen className="w-8 h-8 text-base-content/60" />
              </div>
              <p className="text-lg font-medium">{t("noLectures")}</p>
              <p className="text-sm opacity-70 max-w-md mt-2">{t("noLecturesDescription")}</p>
            </div>
          )
        ) : (
          <div className="col-span-full flex justify-center py-10">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}
      </div>
      {!selectedChild && lectureAccessTotalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="join">
            <button
              className="join-item btn"
              onClick={() => handleLecturesPageChange(lecturesPage - 1)}
              disabled={lecturesPage === 1}
            >
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            {Array.from({ length: Math.min(5, lectureAccessTotalPages) }).map((_, i) => {
              let pageNum
              if (lectureAccessTotalPages <= 5) {
                pageNum = i + 1
              } else if (lecturesPage <= 3) {
                pageNum = i + 1
              } else if (lecturesPage >= lectureAccessTotalPages - 2) {
                pageNum = lectureAccessTotalPages - 4 + i
              } else {
                pageNum = lecturesPage - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  className={`join-item btn ${lecturesPage === pageNum ? "btn-primary" : ""}`}
                  onClick={() => handleLecturesPageChange(pageNum)}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              className="join-item btn"
              onClick={() => handleLecturesPageChange(lecturesPage + 1)}
              disabled={lecturesPage === lectureAccessTotalPages}
            >
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )

  // New function to render the exam scores tab
  const renderExamScoresTab = () => (
    <div>
      {!loading ? (
        examScores.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {examScores.map((exam, index) => (
              <div
                key={index}
                className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow"
              >
                <div className="card-body p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="card-title text-base line-clamp-1">{exam.lecture.name}</h3>
                    <div className={`badge ${exam.passed ? "badge-success" : "badge-error"} whitespace-nowrap`}>
                      {exam.passed ? t("exams.passed") || "Passed" : t("exams.failed") || "Failed"}
                    </div>
                  </div>
                  <p className="text-sm opacity-70 line-clamp-2 mb-3">
                    {exam.lecture.description || t("noDescription")}
                  </p>
                  <div className="bg-base-200/50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{t("exams.score") || "Score"}:</span>
                      <span className="font-bold text-lg">
                        {exam.score} / {exam.maxScore}
                      </span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${exam.passed ? "bg-success" : "bg-error"}`}
                        style={{ width: `${(exam.score / exam.maxScore) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs mt-2 opacity-70">
                      {t("exams.passingThreshold") || "Passing threshold"}: {exam.passingThreshold} / {exam.maxScore}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-between items-center mt-3 text-xs opacity-70 gap-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      {new Date(exam.submittedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      {exam.passed ? (
                        <CheckCircle className="w-3 h-3 flex-shrink-0 text-success" />
                      ) : (
                        <XCircle className="w-3 h-3 flex-shrink-0 text-error" />
                      )}
                      {exam.passed
                        ? t("exams.passedMessage") || "Passed successfully"
                        : t("exams.failedMessage") || "Needs improvement"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="bg-base-200 p-4 rounded-full mb-4">
              <FileText className="w-8 h-8 text-base-content/60" />
            </div>
            <p className="text-lg font-medium">{t("exams.noExams") || "No exam scores available"}</p>
            <p className="text-sm opacity-70 max-w-md mt-2">
              {t("exams.noExamsDescription") || "Your child hasn't taken any exams yet."}
            </p>
          </div>
        )
      ) : (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}
    </div>
  )

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab)
      if (tab === "transactions") {
        setTransactionsPage(1)
      } else if (tab === "lectures") {
        setLecturesPage(1)
      }
    }
  }

  const renderChildrenSelector = () => {
    if (!isParent) return null

    return (
      <div className="card bg-base-100 shadow-sm border border-base-200 mb-8">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">{t("children.title") || "Your Children"}</h2>
            <Users className="w-5 h-5 text-primary" />
          </div>
          {childrenLoading ? (
            <div className="flex justify-center py-4">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : children.length > 0 ? (
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => handleChildSelect("parent")}
                  className={`btn ${!selectedChild ? "btn-primary" : "btn-outline"}`}
                >
                  <UserCircle2 className="w-4 h-4 mr-2" />
                  {t("children.yourAccount") || "Your Account"}
                </button>
                {children.map((child) => (
                  <button
                    key={child._id}
                    onClick={() => handleChildSelect(child._id)}
                    className={`btn ${selectedChild === child._id ? "btn-primary" : "btn-outline"}`}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {child.name}
                  </button>
                ))}
              </div>
              {selectedChild && (
                <div className="bg-base-200/50 p-4 rounded-lg">
                  {(() => {
                    const child = children.find((c) => c._id === selectedChild)
                    if (!child) return null
                    return (
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="avatar avatar-placeholder">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xl text-primary font-medium">{child.name.charAt(0)}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium">{child.name}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-2">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-primary" />
                              <span className="text-sm">{child.level?.name || t("notAvailable")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <School className="w-4 h-4 text-primary" />
                              <span className="text-sm">{child.faction || t("notAvailable")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Wallet className="w-4 h-4 text-primary" />
                              <span className="text-sm">
                                {child.generalPoints || 0} {t("balance.currency")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Info className="w-4 h-4 text-primary" />
                              <span className="text-sm">
                                {t("profile.sequenceId")}: {child.sequencedId}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 bg-base-200/30 rounded-xl">
              <div className="flex flex-col items-center justify-center text-base-content/60">
                <div className="bg-base-200 p-4 rounded-full mb-4">
                  <Users className="w-8 h-8 text-base-content/60" />
                </div>
                <p className="text-lg font-medium">{t("children.noChildren") || "No children found"}</p>
                <p className="text-sm opacity-70 max-w-md mt-2">
                  {t("children.noChildrenDescription") || "You don't have any children linked to your account yet."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100" dir={isRTL ? "rtl" : "ltr"}>
      <div className="bg-gradient-to-b from-primary/10 to-transparent pt-6 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-center mb-2">{t("title")}</h1>
          <p className="text-center text-base-content/70">{t("subtitle")}</p>
        </div>
      </div>

      <div className="mx-auto px-4 -mt-8">
        {fetchError && (
          <div className="alert alert-error max-w-md mx-auto mb-6">
            <X className="w-5 h-5" />
            <span>{fetchError}</span>
          </div>
        )}

        {userInfo && <ReferralSection userInfo={userInfo} onUserUpdate={updateCurrentUser} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          {/* User Profile Card - Always show */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-4 md:p-6">
              <div className="flex items-center gap-4">
                <div className="avatar avatar-placeholder">
                  <div className="bg-primary/10 text-primary rounded-full w-12 md:w-16">
                    <span className="text-xl">{userInfo?.name?.charAt(0) || "U"}</span>
                  </div>
                </div>
                <div className="overflow-hidden">
                  <h2 className="card-title text-base md:text-lg truncate">{userInfo?.name || t("user")}</h2>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-base-content/60">{t("profile.email")}:</span>
                    <p className="text-sm opacity-70 truncate">{userInfo?.email || ""}</p>
                  </div>
                  <div
                    className="flex items-center gap-1 tooltip"
                    data-tip={
                      t("profile.sequenceIdTooltip") || "Parents should use this ID when signing up to link accounts"
                    }
                  >
                    <span className="text-xs font-semibold text-base-content/60">{t("profile.sequenceId")}:</span>
                    <p className="text-sm opacity-70 truncate">{userInfo?.sequencedId || ""}</p>
                    <Info className="w-3 h-3 text-primary flex-shrink-0" />
                  </div>
                  <div
                    className="flex items-center gap-1 tooltip"
                    data-tip={
                      t("profile.userSerial") || "Send this to your friends to invite them to the platform and win rewards"
                    }
                  >
                    <span className="text-xs font-semibold text-base-content/60">{t("profile.userSerial")}:</span>
                    <p className="text-base opacity-70 font-bold truncate">{userInfo?.userSerial || ""}</p>
                    <Info className="w-3 h-3 text-primary flex-shrink-0" />
                  </div>
                  <div className="badge badge-outline mt-1">{userInfo?.role || t("student")}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Add Child section for parents */}
          {userInfo?.role === "Parent" && (
            <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-6">
                <h2 className="card-title text-lg font-semibold mb-4">{t("addChild.title") || "Add Child"}</h2>
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-base-content/80">
                        {t("addChild.label") || "Child's Sequence ID"}
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sequencedId}
                        onChange={(e) => setSequencedId(e.target.value)}
                        placeholder={t("addChild.placeholder") || "Enter your child's sequence ID"}
                        className="input input-bordered flex-1 focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <button
                        onClick={handleAddChild}
                        disabled={addChildLoading}
                        className="btn btn-primary min-w-[120px]"
                      >
                        {addChildLoading ? (
                          <span className="loading loading-spinner"></span>
                        ) : (
                          t("addChild.button") || "Add Child"
                        )}
                      </button>
                    </div>
                  </div>
                  {addChildError && (
                    <div className="alert alert-error shadow-lg">
                      <X className="w-5 h-5 shrink-0" />
                      <span>{addChildError}</span>
                    </div>
                  )}
                  {addChildSuccess && (
                    <div className="alert alert-success shadow-lg">
                      <Check className="w-5 h-5 shrink-0" />
                      <span>{addChildSuccess}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {userInfo?.role === "Student" && userInfo?.sequencedId && (
            <div className="lg:col-span-3 alert alert-info text-info-content">
              <Info className="w-5 h-5" />
              <div>
                <h3 className="font-bold">{t("profile.parentLinkTitle") || "For Parents"}</h3>
                <div className="text-sm">
                  {t("profile.parentLinkDescription") ||
                    "Parents should use this Sequence ID when registering to link their account with yours:"}
                  <span className="font-mono bg-info-content/10 px-2 py-1 rounded ml-2">{userInfo.sequencedId}</span>
                  <button
                    onClick={() => copyToClipboard(userInfo.sequencedId)}
                    className="btn btn-xs btn-ghost ml-2"
                    title={t("copy")}
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {userInfo?.role === "Student" && (
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body">
                <h2 className="card-title mb-4">{t("actions.title")}</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={startScanner} className="btn btn-primary" disabled={selectedChild !== null}>
                    <QrCode className="w-4 h-4 mr-2" />
                    {t("scanner.button")}
                  </button>
                  <button
                    onClick={() => {
                      setRedeemError(null)
                      setRedeemSuccess(null)
                      setRedeemCode("")
                      document.getElementById("redeem_modal").showModal()
                    }}
                    className="btn btn-outline btn-primary"
                    disabled={selectedChild !== null}
                  >
                    <Ticket className="w-4 h-4 mr-2" />
                    {t("redeem.button")}
                  </button>
                </div>
                {selectedChild && (
                  <div className="alert alert-info mt-4 text-sm">
                    <Info className="w-4 h-4" />
                    <span>
                      {t("children.actionsDisabled") || "Actions are disabled when viewing a child's account."}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {renderChildrenSelector()}

        {!selectedChild && (
          <div className="card bg-base-100 shadow-sm border border-base-200 mb-8">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">{t("lecturerPoints.title")}</h2>
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              {loading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : pointsBalances.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {pointsBalances.map((balance, index) => (
                    <div key={index} className="bg-base-200/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {balance.lecturer ? (
                            <span className="text-primary font-medium">{balance.lecturer.name.charAt(0)}</span>
                          ) : (
                            <Wallet className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <h3 className="font-medium truncate">
                          {balance.lecturer ? balance.lecturer.name : t("generalPoints")}
                        </h3>
                      </div>
                      <div className="flex justify-between items-end">
                        <p className="text-2xl font-bold">{balance.points}</p>
                        <span className="text-xs opacity-70">{t("balance.currency")}</span>
                      </div>
                      <p className="text-sm opacity-80 mt-2 line-clamp-2">{t("lecturerPoints.description")}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-base-200/30 rounded-xl">
                  <div className="flex flex-col items-center justify-center text-base-content/60">
                    <div className="bg-base-200 p-4 rounded-full mb-4">
                      <Wallet className="w-8 h-8 text-base-content/60" />
                    </div>
                    <p className="text-lg font-medium">{t("noLecturerPoints")}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="card bg-base-100 shadow-sm border border-base-200 mb-8">
          <div className="card-body p-0">
            <div className="tabs tabs-bordered">
              <button
                className={`tab tab-lg ${activeTab === "transactions" ? "tab-active" : ""}`}
                onClick={() => handleTabChange("transactions")}
              >
                <Clock className="w-4 h-4 mr-2" />
                {selectedChild
                  ? `${children.find((c) => c._id === selectedChild)?.name}'s ${t("transactions.title").toLowerCase()}`
                  : t("transactions.title")}
              </button>
              <button
                className={`tab tab-lg ${activeTab === "lectures" ? "tab-active" : ""}`}
                onClick={() => handleTabChange("lectures")}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {selectedChild
                  ? `${children.find((c) => c._id === selectedChild)?.name}'s ${t("lectures.title").toLowerCase()}`
                  : t("lectures.title")}
              </button>
              {/* Only show the exams tab when a child is selected */}
              {selectedChild && (
                <button
                  className={`tab tab-lg ${activeTab === "exams" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("exams")}
                >
                  <Award className="w-4 h-4 mr-2" />
                  {`${children.find((c) => c._id === selectedChild)?.name}'s ${t("exams.title") || "Exam Scores"}`}
                </button>
              )}
            </div>
            <div className="p-4">
              {activeTab === "transactions"
                ? renderTransactionsTab()
                : activeTab === "lectures"
                  ? renderLectureAccessTab()
                  : renderExamScoresTab()}
            </div>
          </div>
        </div>
      </div>

      <dialog id="scanner_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-base-100 relative max-w-md p-6">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={stopScanner}>
              <X className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center mb-4 text-primary">
            <QrCode className="w-6 h-6 mr-2" />
            <h3 className="font-bold text-xl">{t("scanner.title")}</h3>
          </div>
          {scannerError && (
            <div className="alert alert-error mb-4">
              <X className="w-5 h-5" />
              <span>{scannerError}</span>
              <button
                className="btn btn-sm btn-ghost ml-auto"
                onClick={() => {
                  setScannerError(null)
                  startScanner()
                }}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                {t("retry")}
              </button>
            </div>
          )}
          <div className="flex flex-col items-center justify-center">
            {scannerLoading && (
              <div className="absolute inset-0 bg-base-100/80 flex items-center justify-center z-10">
                <div className="flex flex-col items-center">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                  <p className="mt-4 font-medium">{t("scanner.initializing")}</p>
                </div>
              </div>
            )}
            <div id="qr-reader" className="w-full max-w-xs overflow-hidden rounded-lg border-2 border-primary/20">
              <div className="qr-overlay absolute pointer-events-none">
                <div className="qr-corners"></div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm mb-3">{t("scanner.instructions")}</p>
              <div className="flex justify-center gap-3 mt-4">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    if (scannerRef.current) {
                      stopScanner()
                      setTimeout(startScanner, 500)
                    }
                  }}
                >
                  <Camera className="w-4 h-4 mr-1" />
                  {t("scanner.switchCamera")}
                </button>
              </div>
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={stopScanner}>close</button>
        </form>
      </dialog>

      <dialog id="redeem_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-base-100 relative max-w-md p-6">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              <X className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center mb-4 text-primary">
            <Gift className="w-6 h-6 mr-2" />
            <h3 className="font-bold text-xl">{t("redeem.modalTitle")}</h3>
          </div>
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
                placeholder={t("redeem.placeholder")}
                className="input input-bordered w-full pr-10"
                dir={isRTL ? "rtl" : "ltr"}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Search className="w-5 h-5 text-base-content/40" />
              </div>
            </div>
            {redeemError && (
              <div className="alert alert-error mt-4">
                <X className="w-5 h-5" />
                <span>{redeemError}</span>
              </div>
            )}
            {redeemSuccess && (
              <div className="alert alert-success mt-4">
                <Check className="w-5 h-5" />
                <span>{redeemSuccess}</span>
              </div>
            )}
            <div className="bg-base-200/50 rounded-lg p-4 mt-4">
              <h4 className="font-medium mb-2 flex items-center">
                <Info className="w-4 h-4 mr-2 text-primary" />
                {t("redeem.rulesTitle")}
              </h4>
              <ul className="space-y-2 text-sm">
                {[t("redeem.rules.1"), t("redeem.rules.2")].map((rule, index) => (
                  <li key={index} className="flex items-start">
                    <span className="bg-primary/20 text-primary w-5 h-5 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={handleRedeemCode} disabled={redeemLoading} className="btn btn-primary w-full mt-4">
              {redeemLoading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                <>
                  <Ticket className="w-4 h-4 mr-2" />
                  {t("redeem.button")}
                </>
              )}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  )
}

export default PromoCodes