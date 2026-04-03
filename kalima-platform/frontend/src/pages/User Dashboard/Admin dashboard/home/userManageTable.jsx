"use client"
import { useState, useEffect } from "react"
import { getAllUsers, deleteUser, createUser } from "../../../../routes/fetch-users"
import { useTranslation } from "react-i18next"
import { FaSync, FaWhatsapp, FaEdit, FaDownload, FaFileExport, FaEye, FaTimes, FaCalculator } from "react-icons/fa"
import toast from "react-hot-toast"
import Pagination from "../../../../components/Pagination"
import CreateUserModal from "../CreateUserModal/CreateUserModal"
import EditUserModal from "../CreateUserModal/EditUserModal"
import { getUserDashboard } from "../../../../routes/auth-services"
import { RecalculateInvites } from "../../../../routes/market"
import { designTokens } from "../../../../constants/designTokens"
import { translateErrorMessage } from "../../../../utils/errorTranslator"
import DSSelect from "../../../../components/DSSelect"
import {
  buildExportFileDate,
  exportCsvFile,
  exportXlsxFile,
  formatDateForExport,
  formatDateTimeForExport,
  getExportLocale,
  normalizeExportValue,
} from "../../../../utils/exportUtils"

const UserManagementTable = () => {
  const { t, i18n } = useTranslation("admin")
  const isRTL = i18n.language === "ar"
  const exportLocale = getExportLocale(i18n.language)
  const dir = isRTL ? "rtl" : "ltr"
  
  const TOKENS = designTokens.colors;
  const SHADOWS = designTokens.shadows;

  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [filters, setFilters] = useState({
    name: "",
    phone: "",
    role: "",
    status: "",
    successfulInvites: "",
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [whatsappModal, setWhatsappModal] = useState({
    isOpen: false,
    phoneNumber: "",
    userName: "",
  })
  const [whatsappMessage, setWhatsappMessage] = useState("")
  const [editModal, setEditModal] = useState({
    isOpen: false,
    user: null,
  })

  // New state for user details modal
  const [userDetailsModal, setUserDetailsModal] = useState({
    isOpen: false,
    user: null,
  })

  const [isAdmin, setIsAdmin] = useState(false)
  const [isSubAdmin, setIsSubAdmin] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(10)

  // Check if current user is admin when component mounts
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const result = await getUserDashboard()
        if (result.success && result.data?.data?.userInfo) {
          // Case-insensitive comparison for "admin" role
          const userRole = result.data?.data?.userInfo?.role || ""
          setIsAdmin(userRole.toLowerCase() === "admin")
          setIsSubAdmin(userRole.toLowerCase() === "subadmin")
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
        setIsAdmin(false)
        setIsSubAdmin(false)
      }
    }
    checkAdminStatus()
  }, [])

  // Fetch users on mount
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const result = await getAllUsers()
      if (result.success) {
        const usersData = Array.isArray(result.data) ? result.data : Array.isArray(result.data?.data) ? result.data.data : []
        setUsers(usersData)
        setFilteredUsers(usersData)
      } else {
        setError(t("admin.errors.fetchUsers"))
      }
    } catch (error) {
      setError(t("admin.errors.fetchUsers"))
    } finally {
      setLoading(false)
    }
  }

  // Fixed recalculate invites function
  const handleRecalculateInvites = async () => {
    try {
      setIsRecalculating(true)
      setError(null)

      const response = await RecalculateInvites()

      if (response.success) {
        // Refresh users data after successful recalculation
        await fetchUsers()
        alert(t("admin.invites.refreshSuccess") || "Invites refreshed successfully!")
      } else {
        const translated = translateErrorMessage(response.message || t("admin.invites.refreshError") || "Error calculating invites data")
        setError(translated)
        alert(translated)
      }
    } catch (error) {
      console.error("Error recalculating invites:", error)
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        t("admin.invites.refreshError") ||
        "Error calculating invites data"
      const translated = translateErrorMessage(errorMessage)
      setError(translated)
      alert(translated)
    } finally {
      setIsRecalculating(false)
    }
  }

  // Apply filters when filters or users change
  useEffect(() => {
    applyFilters()
    setCurrentPage(1)
  }, [filters, users])

  const applyFilters = () => {
    const filtered = users.filter(
      (user) =>
        (!filters.name || (user.name && user.name.toLowerCase().includes(filters.name.toLowerCase()))) &&
        (!filters.phone || (user.phoneNumber && user.phoneNumber.includes(filters.phone))) &&
        (!filters.role || (user.role && user.role.toLowerCase() === filters.role.toLowerCase())) &&
        (!filters.status || getStatus(user) === filters.status) &&
        (filters.successfulInvites === "" ||
          (user.successfulInvites || 0) === Number.parseInt(filters.successfulInvites, 10)),
    )
    setFilteredUsers(filtered)
  }

  const getRoleLabel = (role) => role ? t(`admin.roles.${role.toLowerCase()}`) : t("admin.NA")

  const getStatus = (user) => {
    if (!user.phoneNumber) return t("admin.status.missingData")
    if (user.role === "student" && !user.level) return t("admin.status.missingData")
    return t("admin.status.valid")
  }

  const handleDelete = async (userId) => {
    if (!window.confirm(t("admin.confirmDelete"))) return
    try {
      const result = await deleteUser(userId)
      if (result.success) {
        setUsers((prev) => prev.filter((u) => u._id !== userId))
      } else {
        setError(translateErrorMessage(result.error))
      }
    } catch (error) {
      setError(translateErrorMessage(error.message))
    }
  }

  const handleCreateUser = async (userData) => {
    try {
      setError(null)
      const result = await createUser(userData)
      if (result.success) {
        setUsers((prev) => [...prev, result.data])
        setShowCreateModal(false)
        fetchUsers() // Refresh users after creation
      } else {
        throw new Error(translateErrorMessage(result.error))
      }
    } catch (error) {
      setError(translateErrorMessage(error.message))
    }
  }

  // Open edit modal
  const openEditModal = (user) => {
    setEditModal({
      isOpen: true,
      user,
    })
  }

  // Open user details modal
  const openUserDetailsModal = (user) => {
    setUserDetailsModal({
      isOpen: true,
      user,
    })
  }

  // Handle user update
  const handleUserUpdated = (userId, updatedData) => {
    setUsers((prev) => prev.map((user) => (user._id === userId ? { ...user, ...updatedData } : user)))
  }

  // Open WhatsApp modal
  const openWhatsappModal = (phoneNumber, userName) => {
    if (!phoneNumber) {
      alert(t("admin.noPhoneNumber"))
      return
    }
    setWhatsappModal({
      isOpen: true,
      phoneNumber,
      userName,
    })
    setWhatsappMessage("")
  }

  // Send WhatsApp message
  const sendWhatsappMessage = () => {
    let formattedNumber = whatsappModal.phoneNumber.replace(/\D/g, "")
    if (!formattedNumber.startsWith("2")) {
      formattedNumber = "2" + formattedNumber
    }
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(whatsappMessage)}`
    window.open(whatsappUrl, "_blank")
    setWhatsappModal({
      isOpen: false,
      phoneNumber: "",
      userName: "",
    })
  }

  // Export functionality
  const formatObjectDisplay = (value) => {
    if (!value) return ""
    if (Array.isArray(value)) {
      return value.map((item) => formatObjectDisplay(item)).filter(Boolean).join(" | ")
    }
    if (typeof value === "object") {
      return value.nameAr || value.name || value.label || value._id || ""
    }
    return String(value)
  }

  const boolLabel = (value) =>
    value
      ? t("admin.yes", { defaultValue: isRTL ? "نعم" : "Yes" })
      : t("admin.no", { defaultValue: isRTL ? "لا" : "No" })

  const exportColumns = [
    { key: "name", label: t("admin.export.name", { defaultValue: isRTL ? "الاسم" : "Name" }) },
    { key: "email", label: t("admin.export.email", { defaultValue: isRTL ? "البريد الإلكتروني" : "Email" }) },
    { key: "role", label: t("admin.export.role", { defaultValue: isRTL ? "الدور" : "Role" }) },
    { key: "status", label: t("admin.export.status", { defaultValue: isRTL ? "الحالة" : "Status" }) },
    { key: "phoneNumber", label: t("admin.export.phone", { defaultValue: isRTL ? "رقم الهاتف" : "Phone Number" }) },
    { key: "phoneNumber2", label: t("admin.userDetails.secondPhone", { defaultValue: isRTL ? "رقم إضافي" : "Second Phone" }) },
    { key: "gender", label: t("admin.userDetails.gender", { defaultValue: isRTL ? "النوع" : "Gender" }) },
    { key: "government", label: t("admin.export.government", { defaultValue: isRTL ? "المحافظة" : "Government" }) },
    { key: "administrationZone", label: t("admin.export.administrationZone", { defaultValue: isRTL ? "المنطقة الإدارية" : "Administration Zone" }) },
    { key: "userSerial", label: t("admin.export.userSerial", { defaultValue: isRTL ? "الرقم التعريفي" : "User Serial" }) },
    { key: "sequencedId", label: t("admin.export.sequenceId", { defaultValue: isRTL ? "الرقم التسلسلي" : "Sequence ID" }) },
    { key: "stage", label: t("admin.userDetails.stage", { defaultValue: isRTL ? "المرحلة" : "Stage" }) },
    { key: "level", label: t("admin.userDetails.level", { defaultValue: isRTL ? "المستوى" : "Level" }) },
    { key: "subject", label: t("admin.userDetails.subject", { defaultValue: isRTL ? "المادة" : "Subject" }) },
    { key: "profession", label: t("admin.userDetails.profession", { defaultValue: isRTL ? "المهنة" : "Profession" }) },
    { key: "school", label: t("admin.userDetails.school", { defaultValue: isRTL ? "المدرسة" : "School" }) },
    { key: "teachesAtType", label: t("admin.userDetails.teachesAt", { defaultValue: isRTL ? "مكان التدريس" : "Teaches At" }) },
    { key: "centers", label: t("admin.userDetails.centers", { defaultValue: isRTL ? "المراكز" : "Centers" }) },
    { key: "children", label: t("admin.userDetails.children", { defaultValue: isRTL ? "الأبناء" : "Children" }) },
    { key: "assignedLecturer", label: t("admin.userDetails.assignedLecturer", { defaultValue: isRTL ? "المحاضر المعين" : "Assigned Lecturer" }) },
    { key: "parentPhoneNumber", label: t("admin.userDetails.parentPhone", { defaultValue: isRTL ? "هاتف ولي الأمر" : "Parent Phone" }) },
    { key: "hobbies", label: t("admin.userDetails.hobbies", { defaultValue: isRTL ? "الهوايات" : "Hobbies" }) },
    { key: "faction", label: t("admin.userDetails.faction", { defaultValue: isRTL ? "الفئة" : "Faction" }) },
    { key: "bio", label: t("admin.userDetails.bio", { defaultValue: isRTL ? "نبذة" : "Bio" }) },
    { key: "expertise", label: t("admin.userDetails.expertise", { defaultValue: isRTL ? "الخبرة" : "Expertise" }) },
    { key: "generalPoints", label: t("admin.userDetails.generalPoints", { defaultValue: isRTL ? "الرصيد العام" : "General Balance" }) },
    { key: "totalPoints", label: t("admin.userDetails.totalPoints", { defaultValue: isRTL ? "إجمالي الرصيد" : "Total Balance" }) },
    { key: "promoPoints", label: t("admin.export.promoPoints", { defaultValue: isRTL ? "رصيد الأكواد" : "Promo Balance" }) },
    { key: "views", label: t("admin.userDetails.views", { defaultValue: isRTL ? "المشاهدات" : "Views" }) },
    { key: "successfulInvites", label: t("admin.userDetails.successfulInvites", { defaultValue: isRTL ? "الدعوات الناجحة" : "Successful Invites" }) },
    { key: "isEmailVerified", label: t("admin.userDetails.emailVerified", { defaultValue: isRTL ? "تم التحقق من البريد" : "Email Verified" }) },
    { key: "referredBy", label: t("admin.export.referredBy", { defaultValue: isRTL ? "تمت الإحالة بواسطة" : "Referred By" }) },
    { key: "createdAt", label: t("admin.export.joinedDate", { defaultValue: isRTL ? "تاريخ الانضمام" : "Joined Date" }) },
    { key: "updatedAt", label: t("admin.export.updatedAt", { defaultValue: isRTL ? "آخر تحديث" : "Updated At" }) },
  ]

  const mapUserForExport = (user) => ({
    name: user.name || "",
    email: user.email || "",
    role: getRoleLabel(user.role || ""),
    status: getStatus(user),
    phoneNumber: user.phoneNumber || "",
    phoneNumber2: user.phoneNumber2 || "",
    gender: user.gender || "",
    government: user.government || "",
    administrationZone: user.administrationZone || "",
    userSerial: user.userSerial || "",
    sequencedId: user.sequencedId || "",
    stage: formatObjectDisplay(user.stage),
    level: formatObjectDisplay(user.level),
    subject: formatObjectDisplay(user.subject),
    profession: user.profession || "",
    school: user.school || "",
    teachesAtType: user.teachesAtType || "",
    centers: normalizeExportValue(user.centers),
    children: normalizeExportValue(
      Array.isArray(user.children)
        ? user.children.map((child) => child?.name || child?.sequencedId || child?._id || child)
        : user.children,
    ),
    assignedLecturer: formatObjectDisplay(user.assignedLecturer),
    parentPhoneNumber: user.parentPhoneNumber || "",
    hobbies: normalizeExportValue(user.hobbies || user.hobby || ""),
    faction: user.faction || "",
    bio: user.bio || "",
    expertise: user.expertise || "",
    generalPoints: user.generalPoints ?? "",
    totalPoints: user.totalPoints ?? "",
    promoPoints: user.promoPoints ?? "",
    views: user.views ?? "",
    successfulInvites: user.successfulInvites ?? "",
    isEmailVerified: user.isEmailVerified === undefined ? "" : boolLabel(Boolean(user.isEmailVerified)),
    referredBy: formatObjectDisplay(user.referredBy),
    createdAt: formatDateForExport(user.createdAt, exportLocale),
    updatedAt: formatDateTimeForExport(user.updatedAt, exportLocale),
  })

  const exportUsers = async ({ format = "xlsx", exportAll = false }) => {
    setIsExporting(true)
    try {
      const dataToExport = exportAll ? users : filteredUsers
      if (!dataToExport.length) {
        toast.error(
          t("admin.export.noData", {
            defaultValue: isRTL ? "لا توجد بيانات للتصدير" : "No data available for export",
          }),
        )
        return
      }

      const rows = dataToExport.map(mapUserForExport)
      const fileDate = buildExportFileDate()
      const scope = exportAll ? "all-users" : "filtered-users"

      if (format === "xlsx") {
        exportXlsxFile({
          fileName: `${scope}-${fileDate}.xlsx`,
          sheets: [
            {
              name: t("admin.userManagement.title", { defaultValue: isRTL ? "المستخدمون" : "Users" }),
              rows,
              columns: exportColumns,
            },
          ],
        })
      } else {
        exportCsvFile({
          fileName: `${scope}-${fileDate}.csv`,
          rows,
          columns: exportColumns,
        })
      }

      const successMessage = exportAll
        ? t("admin.export.successAll", { count: dataToExport.length })
        : t("admin.export.successFiltered", { count: dataToExport.length })
      toast.success(successMessage)
    } catch (error) {
      console.error("Export error:", error)
      toast.error(t("admin.export.error"))
    } finally {
      setIsExporting(false)
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return t("admin.NA")
    return new Date(dateString).toLocaleDateString()
  }

  // Render user details based on role
  const renderUserDetails = (user) => {
    if (!user) return null

    const commonFields = (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("admin.userDetails.name")}</label>
            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.name || t("admin.NA")}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("admin.userDetails.email")}</label>
            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.email || t("admin.NA")}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("admin.userDetails.gender")}</label>
            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.gender || t("admin.NA")}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("admin.userDetails.phoneNumber")}</label>
            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.phoneNumber || t("admin.NA")}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("admin.userDetails.role")}</label>
            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{getRoleLabel(user.role)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("admin.userDetails.joinedDate")}</label>
            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{formatDate(user.createdAt)}</p>
          </div>
          {user.government && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("admin.userDetails.government")}
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.government}</p>
            </div>
          )}
          {user.administrationZone && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("admin.userDetails.administrationZone")}
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.administrationZone}</p>
            </div>
          )}
          {user.isEmailVerified !== undefined && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("admin.userDetails.emailVerified")}
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {user.isEmailVerified ? t("admin.yes") : t("admin.no")}
              </p>
            </div>
          )}
          {user.successfulInvites !== undefined && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("admin.userDetails.successfulInvites")}
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.successfulInvites || 0}</p>
            </div>
          )}
        </div>
      </>
    )

    const roleSpecificFields = () => {
      const role = user.role ? user.role.toLowerCase() : "";
      switch (role) {
        case "student":
          return (
            <div className="border-t pt-4">
              <h4 className="text-lg font-semibold mb-3 text-blue-600">{t("admin.userDetails.studentInfo")}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.level && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("admin.userDetails.level")}
                    </label>
                    <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded">
                      {typeof user.level === "object" ? user.level.name || user.level._id : user.level}
                    </p>
                  </div>
                )}
                {user.sequencedId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("admin.userDetails.sequenceId")}
                    </label>
                    <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded">{user.sequencedId}</p>
                  </div>
                )}
                {user.parentPhoneNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("admin.userDetails.parentPhone")}
                    </label>
                    <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded">{user.parentPhoneNumber}</p>
                  </div>
                )}
                {user.faction && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("admin.userDetails.faction")}
                    </label>
                    <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded">{user.faction}</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("admin.userDetails.hobbies")}
                  </label>
                  {user.hobbies && user.hobbies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.hobbies.map((hobby, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {hobby}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded">{t("admin.NA")}</p>
                  )}
                </div>
                {user.generalPoints !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("admin.userDetails.generalPoints")}
                    </label>
                    <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded">{user.generalPoints || 0}</p>
                  </div>
                )}
                {user.totalPoints !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("admin.userDetails.totalPoints")}
                    </label>
                    <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded">{user.totalPoints || 0}</p>
                  </div>
                )}
              </div>
            </div>
          )

        case "parent":
          return (
            <div className="border-t pt-4">
              <h4 className="text-lg font-semibold mb-3 text-green-600">{t("admin.userDetails.parentInfo")}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.children && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("admin.userDetails.children")} ({user.children.length})
                    </label>
                    <p className="text-sm text-gray-900 bg-green-50 p-2 rounded">
                      {user.children.length > 0 ? user.children.join(", ") : t("admin.userDetails.noChildren")}
                    </p>
                  </div>
                )}
                {user.views !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("admin.userDetails.views")}
                    </label>
                    <p className="text-sm text-gray-900 bg-green-50 p-2 rounded">{user.views || 0}</p>
                  </div>
                )}
              </div>
            </div>
          )

        case "teacher":
          return (
            <div className="border-t pt-4">
              <h4 className="text-lg font-semibold mb-3 text-purple-600">{t("admin.userDetails.teacherInfo")}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.subject && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("admin.userDetails.subject")}
                    </label>
                    <p className="text-sm text-gray-900 bg-purple-50 p-2 rounded">
                      {typeof user.subject === "object" ? user.subject.name || user.subject._id : user.subject}
                    </p>
                  </div>
                )}
                {user.level && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("admin.userDetails.teachingLevel")}
                    </label>
                    <p className="text-sm text-gray-900 bg-purple-50 p-2 rounded">
                      {Array.isArray(user.level) ? user.level.join(", ") : user.level}
                    </p>
                  </div>
                )}
                {user.school && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("admin.userDetails.school")}
                    </label>
                    <p className="text-sm text-gray-900 bg-purple-50 p-2 rounded">{user.school}</p>
                  </div>
                )}
                {user.teachesAtType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("admin.userDetails.teachesAt")}
                    </label>
                    <p className="text-sm text-gray-900 bg-purple-50 p-2 rounded">{user.teachesAtType}</p>
                  </div>
                )}
                {user.centers && user.centers.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("admin.userDetails.centers")}
                    </label>
                    <p className="text-sm text-gray-900 bg-purple-50 p-2 rounded">{user.centers.join(", ")}</p>
                  </div>
                )}
                {user.phoneNumber2 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("admin.userDetails.secondPhone")}
                    </label>
                    <p className="text-sm text-gray-900 bg-purple-50 p-2 rounded">{user.phoneNumber2}</p>
                  </div>
                )}
                {user.socialMedia && user.socialMedia.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("admin.userDetails.socialMedia")}
                    </label>
                    <div className="space-y-2">
                      {user.socialMedia.map((social, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-purple-50 p-2 rounded">
                          <span className="font-medium">{social.platform}:</span>
                          <span>{social.account}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )

        case "lecturer":
        case "lecturers":
          return (
            <div className="border-t pt-4">
              <h4 className="text-lg font-semibold mb-3 text-indigo-600">{t("admin.userDetails.lecturerInfo")}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.bio && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("admin.userDetails.bio")}</label>
                    <p className="text-sm text-gray-900 bg-indigo-50 p-2 rounded">{user.bio}</p>
                  </div>
                )}
                {user.expertise && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("admin.userDetails.expertise")}
                    </label>
                    <p className="text-sm text-gray-900 bg-indigo-50 p-2 rounded">{user.expertise}</p>
                  </div>
                )}
              </div>
            </div>
          )

        case "assistant":
          return (
            <div className="border-t pt-4">
              <h4 className="text-lg font-semibold mb-3 text-orange-600">{t("admin.userDetails.assistantInfo")}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.assignedLecturer && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("admin.userDetails.assignedLecturer")}
                    </label>
                    <p className="text-sm text-gray-900 bg-orange-50 p-2 rounded">{user.assignedLecturer}</p>
                  </div>
                )}
              </div>
            </div>
          )

        default:
          return null
      }
    }

    return (
      <div className="max-h-96 overflow-y-auto">
        {commonFields}
        {roleSpecificFields()}
      </div>
    )
  }

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
  const filteredLecturers = filteredUsers.filter((user) => String(user.role || "").toLowerCase() === "lecturer").length
  const filteredAssistants = filteredUsers.filter((user) => String(user.role || "").toLowerCase() === "assistant").length
  const filteredStudents = filteredUsers.filter((user) => String(user.role || "").toLowerCase() === "student").length

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  if (loading) {
    return (
      <div className="text-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (error && !showCreateModal) {
    return (
      <div className="alert alert-error max-w-md mx-auto mt-8">
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div 
      className="font-sans w-full mx-auto p-6 md:p-8 my-10" 
      dir={dir}
      style={{ 
        background: TOKENS.neutralCloud, 
        boxShadow: SHADOWS.level1, 
        borderRadius: "2rem",
        border: "1px solid rgba(17,24,39,0.05)"
      }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b pb-6" style={{ borderColor: "rgba(17,24,39,0.1)" }}>
        <div>
          <h1 className={`text-3xl font-extrabold mb-2 ${isRTL ? "text-right" : "text-left"}`} style={{ color: TOKENS.deepTeal }}>
            {t("admin.userManagement.title")}
          </h1>
          <p className="text-base font-medium" style={{ color: TOKENS.slateText }}>{t("admin.userManagement.subtitle") || "Manage and export user data"}</p>
        </div>
        {/* Export Dropdown */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-outline btn-primary" disabled={isExporting}>
            {isExporting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {t("admin.export.exporting")}
              </>
            ) : (
              <>
                <FaDownload className="mr-2" />
                {t("admin.export.export")}
              </>
            )}
          </div>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-64">
            <li className="menu-title">
              <span>{t("admin.export.xlsxFormat", { defaultValue: isRTL ? "تنسيق XLSX" : "XLSX Format" })}</span>
            </li>
            <li>
              <button onClick={() => exportUsers({ format: "xlsx", exportAll: false })} disabled={isExporting || filteredUsers.length === 0}>
                <FaFileExport className="mr-2" />
                {t("admin.export.exportFiltered")} ({filteredUsers.length})
              </button>
            </li>
            <li>
              <button onClick={() => exportUsers({ format: "xlsx", exportAll: true })} disabled={isExporting || users.length === 0}>
                <FaFileExport className="mr-2" />
                {t("admin.export.exportAll")} ({users.length})
              </button>
            </li>
            <div className="divider my-1"></div>
            <li className="menu-title">
              <span>{t("admin.export.csvFormat")}</span>
            </li>
            <li>
              <button onClick={() => exportUsers({ format: "csv", exportAll: false })} disabled={isExporting || filteredUsers.length === 0}>
                <FaFileExport className="mr-2" />
                {t("admin.export.exportFiltered")} ({filteredUsers.length})
              </button>
            </li>
            <li>
              <button onClick={() => exportUsers({ format: "csv", exportAll: true })} disabled={isExporting || users.length === 0}>
                <FaFileExport className="mr-2" />
                {t("admin.export.exportAll")} ({users.length})
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-3" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TOKENS.slateText }}>{t("admin.metrics.totalFiltered")}</p>
          <p className="mt-1 text-2xl font-extrabold" style={{ color: TOKENS.deepTeal }}>{filteredUsers.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-3" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TOKENS.slateText }}>{t("admin.assignedLecturers")}</p>
          <p className="mt-1 text-2xl font-extrabold" style={{ color: TOKENS.deepTeal }}>{filteredLecturers}</p>
        </div>
        <div className="rounded-2xl border bg-white p-3" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TOKENS.slateText }}>{t("admin.assistants")}</p>
          <p className="mt-1 text-2xl font-extrabold" style={{ color: TOKENS.deepTeal }}>{filteredAssistants}</p>
        </div>
        <div className="rounded-2xl border bg-white p-3" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TOKENS.slateText }}>{t("admin.students")}</p>
          <p className="mt-1 text-2xl font-extrabold" style={{ color: TOKENS.deepTeal }}>{filteredStudents}</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-wrap gap-4 mb-8 justify-between items-center bg-white p-4 rounded-[1.4rem] border" style={{ borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}>
        <div className="flex gap-4 flex-wrap w-full md:w-auto">
          <input
            type="text"
            placeholder={t("admin.filters.name")}
            className="input flex-1 md:w-auto font-medium border-2 focus:outline-none focus:ring-0 rounded-full transition-colors"
            style={{ 
              backgroundColor: TOKENS.neutralCloud, 
              borderColor: "transparent", 
              color: TOKENS.deepTeal 
            }}
            onFocus={(e) => { e.target.style.borderColor = TOKENS.softCyanTeal; e.target.style.backgroundColor = "#fff"; }}
            onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = TOKENS.neutralCloud; }}
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
          <input
            type="text"
            placeholder={t("admin.filters.phone")}
            className="input flex-1 md:w-auto font-medium border-2 focus:outline-none focus:ring-0 rounded-full transition-colors"
            style={{ 
              backgroundColor: TOKENS.neutralCloud, 
              borderColor: "transparent", 
              color: TOKENS.deepTeal 
            }}
            onFocus={(e) => { e.target.style.borderColor = TOKENS.softCyanTeal; e.target.style.backgroundColor = "#fff"; }}
            onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = TOKENS.neutralCloud; }}
            value={filters.phone}
            onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
          />
          <DSSelect
            className="select flex-1 md:w-auto font-medium border-2 focus:outline-none focus:ring-0 rounded-full transition-colors font-sans"
            style={{ 
              backgroundColor: TOKENS.neutralCloud, 
              borderColor: "transparent", 
              color: TOKENS.deepTeal 
            }}
            onFocus={(e) => { e.target.style.borderColor = TOKENS.softCyanTeal; e.target.style.backgroundColor = "#fff"; }}
            onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = TOKENS.neutralCloud; }}
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="" className="font-medium bg-white">{t("admin.filters.allTypes")}</option>
            {["student", "parent", "lecturer", "Teacher", "moderator", "subAdmin"].map((role) => (
              <option key={role} value={role} className="font-medium bg-white">
                {t(`admin.roles.${role}`)}
              </option>
            ))}
          </DSSelect>
          <DSSelect
            className="select flex-1 md:w-auto font-medium border-2 focus:outline-none focus:ring-0 rounded-full transition-colors font-sans"
            style={{ 
              backgroundColor: TOKENS.neutralCloud, 
              borderColor: "transparent", 
              color: TOKENS.deepTeal 
            }}
            onFocus={(e) => { e.target.style.borderColor = TOKENS.softCyanTeal; e.target.style.backgroundColor = "#fff"; }}
            onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = TOKENS.neutralCloud; }}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="" className="font-medium bg-white">{t("admin.filters.allStatus")}</option>
            <option value={t("admin.status.valid")} className="font-medium bg-white">{t("admin.status.valid")}</option>
            <option value={t("admin.status.missingData")} className="font-medium bg-white">{t("admin.status.missingData")}</option>
          </DSSelect>
          <input
            type="number"
            min="0"
            placeholder={t("admin.filters.invites")}
            className="input flex-1 md:w-auto font-medium border-2 focus:outline-none focus:ring-0 rounded-full transition-colors"
            style={{ 
              backgroundColor: TOKENS.neutralCloud, 
              borderColor: "transparent", 
              color: TOKENS.deepTeal 
            }}
            onFocus={(e) => { e.target.style.borderColor = TOKENS.softCyanTeal; e.target.style.backgroundColor = "#fff"; }}
            onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = TOKENS.neutralCloud; }}
            value={filters.successfulInvites}
            onChange={(e) => setFilters({ ...filters, successfulInvites: e.target.value })}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto justify-end">
          <button 
            className="btn border-none text-white font-bold rounded-full" 
            style={{ background: TOKENS.warmMango, boxShadow: "0 4px 14px rgba(255, 171, 92, 0.4)" }}
            onClick={() => setShowCreateModal(true)}
          >
            {t("admin.userManagement.createUser")}
          </button>
          <button 
            className="btn btn-outline border-2 rounded-full font-bold" 
            style={{ borderColor: TOKENS.deepTeal, color: TOKENS.deepTeal }}
            onClick={fetchUsers}
          >
            <FaSync />
          </button>
          <button 
            className="btn border-none text-white font-bold rounded-full" 
            style={{ background: TOKENS.richTeal, boxShadow: "0 4px 10px rgba(58, 142, 155, 0.3)" }}
            onClick={handleRecalculateInvites} 
            disabled={isRecalculating}
          >
            {isRecalculating ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {t("admin.invites.calculating") || "Calculating..."}
              </>
            ) : (
              <>
                <FaCalculator className="mr-2" />
                {t("admin.invites.refresh") || "Refresh Invites"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Summary */}
      {(filters.name || filters.phone || filters.role || filters.status) && (
        <div className="alert alert-info mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>
            {t("admin.export.filterInfo")} {filteredUsers.length} {t("admin.export.of")} {users.length}{" "}
            {t("admin.export.usersShown")}
          </span>
        </div>
      )}

      {/* Users Table */}
      <div className="w-full overflow-x-auto bg-white rounded-[1.4rem] border" style={{ borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}>
        <table className="table w-full border-collapse">
          <thead style={{ background: "rgba(77, 179, 194, 0.05)" }}>
            <tr className={`${isRTL ? "text-right" : "text-left"}`}>
              {["name", "phone", "accountType", "status", "successfulInvites", "actions"].map((header) => (
                <th key={header} className="p-4 text-sm md:text-base font-bold whitespace-nowrap" style={{ color: TOKENS.deepTeal, borderBottom: "2px solid rgba(17,24,39,0.05)" }}>
                  {t(`admin.table.${header}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user._id} className={`${isRTL ? "text-right" : "text-left"} transition-colors hover:bg-gray-50`} style={{ borderBottom: "1px solid rgba(17,24,39,0.05)" }}>
                <td className="p-4 whitespace-nowrap font-medium" style={{ color: TOKENS.inkText }}>{user.name || t("admin.NA")}</td>
                <td className="p-4 whitespace-nowrap font-medium font-mono" style={{ color: TOKENS.slateText }}>{user.phoneNumber || t("admin.NA")}</td>
                <td className="p-4 whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: "rgba(77,179,194,0.1)", color: TOKENS.deepTeal }}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="p-4 whitespace-nowrap font-medium" style={{ color: getStatus(user) === t("admin.status.valid") ? "#10B981" : TOKENS.vibrantCoral }}>{getStatus(user)}</td>
                <td className="p-4 whitespace-nowrap font-bold" style={{ color: TOKENS.slateText }}>{user.successfulInvites || 0}</td>
                <td className="p-4 whitespace-nowrap">
                  <div className={`flex items-center gap-2 ${isRTL ? "text-right" : "text-left"}`}>
                    <button
                      className="btn btn-sm btn-circle btn-ghost"
                      style={{ color: TOKENS.deepTeal }}
                      onClick={() => openUserDetailsModal(user)}
                      title={t("admin.actions.viewDetails")}
                    >
                      <FaEye size={16} />
                    </button>
                    {isAdmin | isSubAdmin && (
                      <button
                        className="btn btn-sm btn-circle btn-ghost"
                        style={{ color: TOKENS.richTeal }}
                        onClick={() => openEditModal(user)}
                        title={t("admin.actions.edit")}
                      >
                        <FaEdit size={16} />
                      </button>
                    )}
                    {user.phoneNumber && (
                      <button
                        className="btn btn-sm btn-circle btn-ghost text-green-500"
                        onClick={() => openWhatsappModal(user.phoneNumber, user.name)}
                        title={t("admin.actions.whatsapp")}
                      >
                        <FaWhatsapp size={18} />
                      </button>
                    )}
                    <button 
                      className="btn btn-sm btn-circle btn-ghost" 
                      style={{ color: TOKENS.vibrantCoral }} 
                      onClick={() => handleDelete(user._id)}
                      title={t("admin.actions.delete")}
                    >
                      <FaTimes size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12 bg-base-200/30 rounded-xl">
          <div className="flex flex-col items-center justify-center text-base-content/60">
            <div className="bg-base-200 p-4 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">{t("admin.noUsers") || "No users found"}</p>
            <p className="text-sm opacity-70 max-w-md">
              {filters.name || filters.phone || filters.role || filters.status
                ? t("admin.noUsersFiltered") ||
                "No users match your current filters. Try adjusting your search criteria."
                : t("admin.noUsersYet") || "No users have registered yet. Check back later."}
            </p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredUsers.length}
          itemsPerPage={usersPerPage}
          onPageChange={handlePageChange}
          labels={{
            previous: t("admin.pagination.previous"),
            next: t("admin.pagination.next"),
            showing: t("admin.pagination.showing"),
            of: t("admin.pagination.of"),
          }}
        />
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateUser={handleCreateUser}
        error={error}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, user: null })}
        user={editModal.user}
        onUserUpdated={handleUserUpdated}
      />

      {/* User Details Modal */}
      {userDetailsModal.isOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl" dir={dir}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl">
                {t("admin.userDetails.title")} - {userDetailsModal.user?.name}
              </h3>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setUserDetailsModal({ isOpen: false, user: null })}
              >
                <FaTimes />
              </button>
            </div>
            {renderUserDetails(userDetailsModal.user)}
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setUserDetailsModal({ isOpen: false, user: null })}>
                {t("admin.userDetails.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {whatsappModal.isOpen && (
        <div className="modal modal-open">
          <div className="modal-box" dir={dir}>
            <h3 className="font-bold text-lg">{t("admin.whatsappModal.title", { name: whatsappModal.userName })}</h3>
            <textarea
              className="textarea textarea-bordered w-full mt-4"
              placeholder={t("admin.whatsappModal.placeholder")}
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
            ></textarea>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setWhatsappModal({ isOpen: false, phoneNumber: "", userName: "" })}
              >
                {t("admin.whatsappModal.cancel")}
              </button>
              <button className="btn btn-primary" onClick={sendWhatsappMessage} disabled={!whatsappMessage.trim()}>
                {t("admin.whatsappModal.send")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagementTable
