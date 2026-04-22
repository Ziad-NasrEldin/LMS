"use client"
import { useState, useEffect } from "react"
import { getAllUsers, deleteUser, createUser } from "../../../../routes/fetch-users"
import { useTranslation } from "react-i18next"
import { FaSync, FaWhatsapp, FaEdit, FaDownload, FaFileExport, FaEye, FaTimes } from "react-icons/fa"
import toast from "react-hot-toast"
import Pagination from "../../../../components/Pagination"
import CreateUserModal from "../CreateUserModal/CreateUserModal"
import EditUserModal from "../CreateUserModal/EditUserModal"
import Button from "../../../../components/ui/Button"
import Input from "../../../../components/ui/Input"
import Textarea from "../../../../components/ui/Textarea"
import { getUserDashboard } from "../../../../routes/auth-services"
import { designTokens } from "../../../../constants/designTokens"
import { translateErrorMessage } from "../../../../utils/errorTranslator"
import DSSelect from "../../../../components/DSSelect"
import { getAllSubjects } from "../../../../routes/courses"
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
  const { t: baseT, i18n } = useTranslation("admin")
  const t = (key, options) => {
    const translated = baseT(key, options)

    if (translated !== key || !String(key).startsWith("admin.")) {
      return translated
    }

    const fallbackKey = String(key).slice("admin.".length)
    const fallback = baseT(fallbackKey, options)

    if (fallback !== fallbackKey) {
      return fallback
    }

    return options?.defaultValue ?? translated
  }
  const isRTL = i18n.language === "ar"
  const exportLocale = getExportLocale(i18n.language)
  const dir = isRTL ? "rtl" : "ltr"
  const filterLabels = {
    name: t("admin.filters.name", { defaultValue: isRTL ? "الاسم" : "Name" }),
    phone: t("admin.filters.phone", { defaultValue: isRTL ? "رقم الهاتف" : "Phone Number" }),
    allTypes: t("admin.filters.allTypes", { defaultValue: isRTL ? "كل الأنواع" : "All Types" }),
    allStatus: t("admin.filters.allStatus", { defaultValue: isRTL ? "كل الحالات" : "All Statuses" }),
  }
  const statusLabels = {
    valid: t("admin.status.valid", { defaultValue: isRTL ? "صالح" : "Valid" }),
    missingData: t("admin.status.missingData", { defaultValue: isRTL ? "بيانات ناقصة" : "Missing Data" }),
  }
  
  const TOKENS = designTokens.colors;
  const SHADOWS = designTokens.shadows;

  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    name: "",
    phone: "",
    role: "",
    status: "",
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createUserError, setCreateUserError] = useState(null)
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
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false)

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

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const result = await getAllSubjects()
        if (result.success) {
          setSubjects(Array.isArray(result.data) ? result.data : [])
        }
      } catch (fetchError) {
        console.error("Failed to fetch subjects for user details:", fetchError)
      }
    }

    fetchSubjects()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportDropdownOpen) {
        setExportDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [exportDropdownOpen])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getAllUsers()
      if (result.success) {
        const usersData = Array.isArray(result.data) ? result.data : Array.isArray(result.data?.data) ? result.data.data : []
        setUsers(usersData)
        setFilteredUsers(usersData)
        setError(null)
      } else {
        setError(translateErrorMessage(result.error || result.message || t("admin.errors.fetchUsers")))
      }
    } catch (error) {
      setError(translateErrorMessage(error?.message || t("admin.errors.fetchUsers")))
    } finally {
      setLoading(false)
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
        (!filters.status || getStatus(user) === filters.status),
    )
    setFilteredUsers(filtered)
  }

  const getRoleLabel = (role) => role ? t(`admin.roles.${role.toLowerCase()}`) : t("admin.NA")

  const getStatus = (user) => {
    if (!user.phoneNumber) return statusLabels.missingData
    if (String(user.role || "").toLowerCase() === "student" && !user.level) return statusLabels.missingData
    return statusLabels.valid
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
      setCreateUserError(null)
      const result = await createUser(userData)
      if (result.success) {
        setUsers((prev) => [...prev, result.data])
        setShowCreateModal(false)
        setCreateUserError(null)
        fetchUsers() // Refresh users after creation
      } else {
        setCreateUserError(result)
      }
    } catch (error) {
      setCreateUserError(error)
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

  const getSubjectName = (subjectValue) => {
    if (!subjectValue) return ""

    if (Array.isArray(subjectValue)) {
      return subjectValue.map((item) => getSubjectName(item)).filter(Boolean).join(", ")
    }

    if (typeof subjectValue === "object") {
      return subjectValue.nameAr || subjectValue.name || subjectValue.label || subjectValue._id || ""
    }

    const matchedSubject = subjects.find((subject) => String(subject._id) === String(subjectValue))
    return matchedSubject?.nameAr || matchedSubject?.name || String(subjectValue)
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
    subject: getSubjectName(user.subject),
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

    const getLevelName = (level) => {
      if (!level) return t("admin.NA")
      if (typeof level === "object") {
        return level.name || level.nameAr || level._id
      }
      return level
    }

    const getLevelInfo = (level) => {
      // Handle case where level is an ObjectId string (not populated)
      if (!level) return { stage: null, grade: null }
      
      if (typeof level === "string") {
        if (level.match(/^[0-9a-fA-F]{24}$/)) {
          // It's an unpopulated ObjectId - try to get from cache or show loading
          return { stage: null, grade: null, unpopulated: true, objectId: level }
        }
        return { stage: null, grade: level }
      }
      
      if (typeof level === "object") {
        // Check if it's a populated level object with parentLevel
        if (level.parentLevel) {
          const stage = level.parentLevel.name || level.parentLevel.nameAr || level.parentLevel._id
          const grade = level.name || level.nameAr || level._id
          return { stage, grade }
        }
        
        // If it's a stage level (kind === "stage"), it's the stage itself
        if (level.kind === "stage") {
          return { stage: level.name || level.nameAr, grade: null }
        }
        
        // If it's a grade level (kind === "grade"), show it as grade
        if (level.kind === "grade") {
          return { stage: null, grade: level.name || level.nameAr }
        }
        
        // Fallback for any other object structure
        return { stage: level.name || level.nameAr, grade: null }
      }
      
      return { stage: null, grade: level }
    }

    const getRoleBadgeColor = (role) => {
      const r = role?.toLowerCase()
      switch (r) {
        case "student": return "bg-blue-100 text-blue-700"
        case "parent": return "bg-green-100 text-green-700"
        case "teacher": return "bg-purple-100 text-purple-700"
        case "lecturer": return "bg-orange-100 text-orange-700"
        default: return "bg-gray-100 text-gray-700"
      }
    }

    const getGenderIcon = (gender) => {
      if (gender?.toLowerCase() === "female") return "👩"
      if (gender?.toLowerCase() === "male") return "👨"
      return "👤"
    }

    const subjectDisplay = getSubjectName(user.subject)

    return (
      <div className="space-y-4">
        {/* Header Section */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/10">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
            {user.name?.charAt(0) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">{user.name}</h3>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
              {getRoleLabel(user.role)}
            </span>
            <span className="text-xs text-gray-500">
              {t("admin.userDetails.joinedDate")}: {formatDate(user.createdAt)}
            </span>
          </div>
        </div>

        {/* Basic Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="text-xs text-gray-500 block">{t("admin.userDetails.gender")}</span>
            <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
              {getGenderIcon(user.gender)} {user.gender === "female" ? t("admin.userDetails.female") : user.gender === "male" ? t("admin.userDetails.male") : t("admin.NA")}
            </span>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="text-xs text-gray-500 block">{t("admin.userDetails.phoneNumber")}</span>
            <span className="text-sm font-medium text-gray-900">{user.phoneNumber || t("admin.NA")}</span>
          </div>
          {user.isEmailVerified !== undefined && (
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs text-gray-500 block">{t("admin.userDetails.emailVerified")}</span>
              <span className={`text-sm font-medium ${user.isEmailVerified ? "text-green-600" : "text-red-500"}`}>
                {user.isEmailVerified ? t("admin.yes") : t("admin.no")}
              </span>
            </div>
          )}
          {user.government && (
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs text-gray-500 block">{t("admin.userDetails.government")}</span>
              <span className="text-sm font-medium text-gray-900">{user.government}</span>
            </div>
          )}
          {user.administrationZone && (
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs text-gray-500 block">{t("admin.userDetails.administrationZone")}</span>
              <span className="text-sm font-medium text-gray-900">{user.administrationZone}</span>
            </div>
          )}
          {user.successfulInvites !== undefined && (
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs text-gray-500 block">{t("admin.userDetails.successfulInvites")}</span>
              <span className="text-sm font-medium text-gray-900">{user.successfulInvites || 0}</span>
            </div>
          )}
        </div>

        {/* Role-specific Info */}
        {user.role?.toLowerCase() === "student" && (
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-bold text-blue-600 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
              {t("admin.userDetails.studentInfo")}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {user.level && (() => {
                const levelInfo = getLevelInfo(user.level)
                const isFullyPopulated = levelInfo.stage || levelInfo.grade
                const isUnpopulated = levelInfo.unpopulated && levelInfo.objectId
                
                return (
                  <>
                    {levelInfo.stage && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <span className="text-xs text-blue-600 block">{t("admin.userDetails.stage")}</span>
                        <span className="text-sm font-bold text-blue-900">{levelInfo.stage}</span>
                      </div>
                    )}
                    {levelInfo.grade && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <span className="text-xs text-blue-600 block">{t("admin.userDetails.level")}</span>
                        <span className="text-sm font-bold text-blue-900">{levelInfo.grade}</span>
                      </div>
                    )}
                    {!isFullyPopulated && !isUnpopulated && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <span className="text-xs text-blue-600 block">{t("admin.userDetails.level")}</span>
                        <span className="text-sm font-bold text-blue-900">{getLevelName(user.level)}</span>
                      </div>
                    )}
                    {isUnpopulated && (
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <span className="text-xs text-yellow-600 block">{t("admin.userDetails.level")}</span>
                        <span className="text-sm font-bold text-yellow-800">{levelInfo.objectId}</span>
                      </div>
                    )}
                  </>
                )
              })()}
              {user.sequencedId && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <span className="text-xs text-blue-600 block">{t("admin.userDetails.sequenceId")}</span>
                  <span className="text-sm font-bold text-blue-900">#{user.sequencedId}</span>
                </div>
              )}
              {user.parentPhoneNumber && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <span className="text-xs text-blue-600 block">{t("admin.userDetails.parentPhone")}</span>
                  <span className="text-sm font-medium text-blue-900">{user.parentPhoneNumber}</span>
                </div>
              )}
              {user.faction && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <span className="text-xs text-blue-600 block">{t("admin.userDetails.faction")}</span>
                  <span className="text-sm font-bold text-blue-900">{user.faction}</span>
                </div>
              )}
              {user.generalPoints !== undefined && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <span className="text-xs text-blue-600 block">{t("admin.userDetails.generalPoints")}</span>
                  <span className="text-sm font-bold text-blue-900">{user.generalPoints || 0}</span>
                </div>
              )}
              {user.totalPoints !== undefined && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <span className="text-xs text-blue-600 block">{t("admin.userDetails.totalPoints")}</span>
                  <span className="text-sm font-bold text-blue-900">{user.totalPoints || 0}</span>
                </div>
              )}
              <div className="col-span-2 sm:col-span-3">
                <span className="text-xs text-blue-600 block mb-1">{t("admin.userDetails.hobbies")}</span>
                {user.hobbies && user.hobbies.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {user.hobbies.map((hobby, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        {hobby}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">{t("admin.NA")}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {user.role?.toLowerCase() === "parent" && (
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-bold text-green-600 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-green-500 rounded-full"></span>
              {t("admin.userDetails.parentInfo")}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {user.children && user.children.length > 0 && (
                <div className="col-span-2 bg-green-50 rounded-lg p-3">
                  <span className="text-xs text-green-600 block">{t("admin.userDetails.children")} ({user.children.length})</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.children.map((child, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        {typeof child === "object" ? child.name || child._id : child}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {user.profession && (
                <div className="bg-green-50 rounded-lg p-3">
                  <span className="text-xs text-green-600 block">{t("admin.userDetails.profession")}</span>
                  <span className="text-sm font-medium text-green-900">{user.profession}</span>
                </div>
              )}
              {user.views !== undefined && (
                <div className="bg-green-50 rounded-lg p-3">
                  <span className="text-xs text-green-600 block">{t("admin.userDetails.views")}</span>
                  <span className="text-sm font-bold text-green-900">{user.views || 0}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {user.role?.toLowerCase() === "teacher" && (
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-bold text-purple-600 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
              {t("admin.userDetails.teacherInfo")}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {user.subject && (
                <div className="bg-purple-50 rounded-lg p-3">
                  <span className="text-xs text-purple-600 block">{t("admin.userDetails.subject")}</span>
                  <span className="text-sm font-bold text-purple-900">{subjectDisplay}</span>
                </div>
              )}
              {user.level && (
                <div className="bg-purple-50 rounded-lg p-3">
                  <span className="text-xs text-purple-600 block">{t("admin.userDetails.teachingLevel")}</span>
                  <span className="text-sm font-medium text-purple-900">
                    {Array.isArray(user.level) 
                      ? user.level.map(l => getLevelName(l)).filter(Boolean).join(", ") 
                      : getLevelName(user.level)}
                  </span>
                </div>
              )}
              {user.school && (
                <div className="bg-purple-50 rounded-lg p-3">
                  <span className="text-xs text-purple-600 block">{t("admin.userDetails.school")}</span>
                  <span className="text-sm font-medium text-purple-900">{user.school}</span>
                </div>
              )}
              {user.teachesAtType && (
                <div className="bg-purple-50 rounded-lg p-3">
                  <span className="text-xs text-purple-600 block">{t("admin.userDetails.teachesAt")}</span>
                  <span className="text-sm font-medium text-purple-900">{user.teachesAtType}</span>
                </div>
              )}
              {user.phoneNumber2 && (
                <div className="bg-purple-50 rounded-lg p-3">
                  <span className="text-xs text-purple-600 block">{t("admin.userDetails.secondPhone")}</span>
                  <span className="text-sm font-medium text-purple-900">{user.phoneNumber2}</span>
                </div>
              )}
              {user.centers && user.centers.length > 0 && (
                <div className="col-span-2 bg-purple-50 rounded-lg p-3">
                  <span className="text-xs text-purple-600 block">{t("admin.userDetails.centers")}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.centers.map((center, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                        {center}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {(user.role?.toLowerCase() === "lecturer" || user.role?.toLowerCase() === "lecturers") && (
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-bold text-orange-600 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
              {t("admin.userDetails.lecturerInfo")}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {user.bio && (
                <div className="col-span-2 bg-orange-50 rounded-lg p-3">
                  <span className="text-xs text-orange-600 block">{t("admin.userDetails.bio")}</span>
                  <span className="text-sm font-medium text-orange-900">{user.bio}</span>
                </div>
              )}
              {user.expertise && (
                <div className="bg-orange-50 rounded-lg p-3">
                  <span className="text-xs text-orange-600 block">{t("admin.userDetails.expertise")}</span>
                  <span className="text-sm font-medium text-orange-900">{user.expertise}</span>
                </div>
              )}
              {user.subject && (
                <div className="bg-orange-50 rounded-lg p-3">
                  <span className="text-xs text-orange-600 block">{t("admin.userDetails.subject")}</span>
                  <span className="text-sm font-medium text-orange-900">{subjectDisplay}</span>
                </div>
              )}
              {user.socialMedia && user.socialMedia.length > 0 && (
                <div className="col-span-2 bg-orange-50 rounded-lg p-3">
                  <span className="text-xs text-orange-600 block">{t("admin.userDetails.socialMedia")}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.socialMedia.map((social, index) => (
                      <span key={index} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                        {social.platform}: {social.account}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
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
        border: "1px solid transparent"
      }}
    >
      {error && !showCreateModal && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b pb-6" style={{ borderColor: "rgba(17,24,39,0.1)" }}>
        <div>
          <h1 className={`text-3xl font-extrabold mb-2 ${isRTL ? "text-right" : "text-left"}`} style={{ color: TOKENS.deepTeal }}>
            {t("admin.userManagement.title")}
          </h1>
          <p className="text-base font-medium" style={{ color: TOKENS.slateText }}>{t("admin.userManagement.subtitle") || "Manage and export user data"}</p>
        </div>
        {/* Export Dropdown */}
          <div className="dropdown dropdown-end">
            <Button 
              variant="primary" 
              disabled={isExporting}
              onClick={(e) => {
                e.stopPropagation()
                setExportDropdownOpen(!exportDropdownOpen)
              }}
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t("admin.export.exporting")}
                </>
              ) : (
                <>
                  <FaDownload className="mr-2" />
                  {t("admin.export.export")}
                </>
              )}
            </Button>
            {exportDropdownOpen && (
            <ul className="dropdown-content z-[1] menu p-2 shadow bg-white rounded-xl w-64 absolute mt-2">
            <li className="menu-title">
              <span>{t("admin.export.xlsxFormat", { defaultValue: isRTL ? "تنسيق XLSX" : "XLSX Format" })}</span>
            </li>
             <li>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => {
                    setExportDropdownOpen(false)
                    exportUsers({ format: "xlsx", exportAll: false })
                  }} 
                  disabled={isExporting || filteredUsers.length === 0}
                >
                  <FaFileExport className="mr-2" />
                  {t("admin.export.exportFiltered")} ({filteredUsers.length})
                </Button>
              </li>
              <li>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => {
                    setExportDropdownOpen(false)
                    exportUsers({ format: "xlsx", exportAll: true })
                  }} 
                  disabled={isExporting || users.length === 0}
                >
                  <FaFileExport className="mr-2" />
                  {t("admin.export.exportAll")} ({users.length})
                </Button>
              </li>
             <div className="divider my-1"></div>
             <li className="menu-title">
               <span>{t("admin.export.csvFormat")}</span>
             </li>
             <li>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => {
                    setExportDropdownOpen(false)
                    exportUsers({ format: "csv", exportAll: false })
                  }} 
                  disabled={isExporting || filteredUsers.length === 0}
                >
                  <FaFileExport className="mr-2" />
                  {t("admin.export.exportFiltered")} ({filteredUsers.length})
                </Button>
              </li>
              <li>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => {
                    setExportDropdownOpen(false)
                    exportUsers({ format: "csv", exportAll: true })
                  }} 
                  disabled={isExporting || users.length === 0}
                >
                   <FaFileExport className="mr-2" />
                   {t("admin.export.exportAll")} ({users.length})
                 </Button>
              </li>
           </ul>
           )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TOKENS.slateText }}>{t("admin.metrics.totalFiltered")}</p>
          <p className="mt-1 text-2xl font-extrabold" style={{ color: TOKENS.deepTeal }}>{filteredUsers.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TOKENS.slateText }}>{t("admin.assignedLecturers")}</p>
          <p className="mt-1 text-2xl font-extrabold" style={{ color: TOKENS.deepTeal }}>{filteredLecturers}</p>
        </div>
        <div className="rounded-2xl bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TOKENS.slateText }}>{t("admin.assistants")}</p>
          <p className="mt-1 text-2xl font-extrabold" style={{ color: TOKENS.deepTeal }}>{filteredAssistants}</p>
        </div>
        <div className="rounded-2xl bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TOKENS.slateText }}>{t("admin.students")}</p>
          <p className="mt-1 text-2xl font-extrabold" style={{ color: TOKENS.deepTeal }}>{filteredStudents}</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div
className="mb-8 grid gap-4 rounded-[1.4rem] bg-white p-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end"
        style={{ borderColor: "transparent", boxShadow: SHADOWS.level1 }}
      >
        <div className="grid w-full gap-4 sm:grid-cols-2 2xl:grid-cols-4">
           <Input
             type="text"
             placeholder={filterLabels.name}
             className="w-full font-medium rounded-full transition-colors"
             value={filters.name}
             onChange={(e) => setFilters({ ...filters, name: e.target.value })}
           />
           <Input
             type="text"
             placeholder={filterLabels.phone}
             className="w-full font-medium rounded-full transition-colors"
             value={filters.phone}
             onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
           />
           <DSSelect
             className="w-full font-medium border-2 focus:outline-none focus:ring-0 rounded-full transition-colors font-sans"
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
             <option value="" className="font-medium bg-white">{filterLabels.allTypes}</option>
             {["student", "parent", "lecturer", "Teacher", "moderator", "subAdmin"].map((role) => (
               <option key={role} value={role} className="font-medium bg-white">
                 {t(`admin.roles.${role}`)}
               </option>
             ))}
           </DSSelect>
           <DSSelect
             className="w-full font-medium border-2 focus:outline-none focus:ring-0 rounded-full transition-colors font-sans"
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
             <option value="" className="font-medium bg-white">{filterLabels.allStatus}</option>
             <option value={statusLabels.valid} className="font-medium bg-white">{statusLabels.valid}</option>
             <option value={statusLabels.missingData} className="font-medium bg-white">{statusLabels.missingData}</option>
           </DSSelect>
        </div>
         <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto xl:justify-end">
           <Button 
             className="w-full rounded-full font-bold sm:w-auto" 
             style={{ background: TOKENS.warmMango, boxShadow: "0 4px 14px rgba(255, 171, 92, 0.4)" }}
             onClick={() => setShowCreateModal(true)}
           >
             {t("admin.userManagement.createUser")}
           </Button>
           <Button 
             variant="outline" 
             className="w-full rounded-full font-bold sm:w-auto" 
             style={{ borderColor: TOKENS.deepTeal, color: TOKENS.deepTeal }}
             onClick={fetchUsers}
           >
             <FaSync />
           </Button>
         </div>
      </div>

      {/* Export Summary */}
       {(filters.name || filters.phone || filters.role || filters.status) && (
         <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 shadow-sm flex items-center gap-3">
           <svg
             xmlns="http://www.w3.org/2000/svg"
             fill="none"
             viewBox="0 0 24 24"
             className="stroke-current shrink-0 w-6 h-6"
           >
             <path
               strokeLinecap="round"
               strokeLinejoin="round"
               strokeWidth={2}
               d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
             ></path>
           </svg>
           <span>
             {t("admin.export.filterInfo")} {filteredUsers.length} {t("admin.export.of")} {users.length} {t("admin.export.usersShown")}
           </span>
         </div>
       )}

      {/* Users Table */}
       <div className="w-full overflow-x-auto bg-white rounded-[1.4rem] border" style={{ borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}>
         <table className="w-full text-left border-collapse">
           <thead style={{ background: "rgba(77, 179, 194, 0.05)" }}>
             <tr>
               {["name", "phone", "accountType", "status", "successfulInvites", "actions"].map((header) => (
                 <th key={header} className="p-4 text-sm md:text-base font-bold whitespace-nowrap" style={{ color: TOKENS.deepTeal, borderBottom: "2px solid rgba(17,24,39,0.05)" }}>
                   {t(`admin.table.${header}`)}
                 </th>
               ))}
             </tr>
           </thead>
           <tbody>
             {currentUsers.map((user) => (
               <tr key={user._id} className="transition-colors hover:bg-slate-100" style={{ borderBottom: "1px solid rgba(17,24,39,0.05)" }}>
                 <td className="p-4 whitespace-nowrap font-medium" style={{ color: TOKENS.inkText }}>{user.name || t("admin.NA")}</td>
                 <td className="p-4 whitespace-nowrap font-medium font-mono" style={{ color: TOKENS.slateText }}>{user.phoneNumber || t("admin.NA")}</td>
                 <td className="p-4 whitespace-nowrap">
                   <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: "rgba(77,179,194,0.1)", color: TOKENS.deepTeal }}>
                     {getRoleLabel(user.role)}
                   </span>
                 </td>
                 <td className="p-4 whitespace-nowrap font-medium" style={{ color: getStatus(user) === statusLabels.valid ? "#10B981" : TOKENS.vibrantCoral }}>{getStatus(user)}</td>
                 <td className="p-4 whitespace-nowrap font-bold" style={{ color: TOKENS.slateText }}>{user.successfulInvites || 0}</td>
                 <td className="p-4 whitespace-nowrap">
                   <div className="flex items-center gap-2">
                     <Button
                       variant="ghost"
                       size="sm"
                       className="rounded-full p-2"
                       style={{ color: TOKENS.deepTeal }}
                       onClick={() => openUserDetailsModal(user)}
                       title={t("admin.actions.viewDetails")}
                     >
                       <FaEye size={16} />
                     </Button>
                    {(isAdmin || isSubAdmin) && (
                       <Button
                         variant="ghost"
                         size="sm"
                         className="rounded-full p-2"
                         style={{ color: TOKENS.richTeal }}
                         onClick={() => openEditModal(user)}
                         title={t("admin.actions.edit")}
                       >
                         <FaEdit size={16} />
                       </Button>
                     )}
                     {user.phoneNumber && (
                       <Button
                         variant="ghost"
                         size="sm"
                         className="rounded-full p-2 text-green-500"
                         onClick={() => openWhatsappModal(user.phoneNumber, user.name)}
                         title={t("admin.actions.whatsapp")}
                       >
                         <FaWhatsapp size={18} />
                       </Button>
                     )}
                     <Button 
                       variant="ghost"
                       size="sm"
                       className="rounded-full p-2" 
                       style={{ color: TOKENS.vibrantCoral }} 
                       onClick={() => handleDelete(user._id)}
                       title={t("admin.actions.delete")}
                     >
                       <FaTimes size={16} />
                     </Button>
                   </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      {/* Empty State */}
       {filteredUsers.length === 0 && !loading && (
         <div className="text-center py-12 bg-slate-100/30 rounded-xl">
      <div className="flex flex-col items-center justify-center text-slate-600">
             <div className="bg-slate-100 p-4 rounded-full mb-4">
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
        <p className="max-w-md text-sm text-slate-600">
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
            previous: t("admin.pagination.previous", { defaultValue: isRTL ? "السابق" : "Previous" }),
            next: t("admin.pagination.next", { defaultValue: isRTL ? "التالي" : "Next" }),
            showing: t("admin.pagination.showing", { defaultValue: isRTL ? "عرض" : "Showing" }),
            of: t("admin.pagination.of", { defaultValue: isRTL ? "من" : "of" }),
          }}
          itemLabel={t("admin.pagination.users", { defaultValue: isRTL ? "مستخدم" : "users" })}
        />
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setCreateUserError(null)
        }}
        onCreateUser={handleCreateUser}
        error={createUserError}
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl" dir={dir}>
              <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800">
                  {t("admin.userDetails.title")}
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full p-1.5 hover:bg-slate-200"
                  onClick={() => setUserDetailsModal({ isOpen: false, user: null })}
                >
                  <FaTimes />
                </Button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                {renderUserDetails(userDetailsModal.user)}
              </div>
              <div className="flex justify-end px-4 py-3 border-t border-slate-200 bg-slate-50">
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => setUserDetailsModal({ isOpen: false, user: null })}
                >
                  {t("admin.userDetails.close")}
                </Button>
              </div>
            </div>
          </div>
        )}
       {whatsappModal.isOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
           <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" dir={dir}>
             <h3 className="font-bold text-lg mb-4">{t("admin.whatsappModal.title", { name: whatsappModal.userName })}</h3>
             <Textarea
               className="w-full mt-4"
               placeholder={t("admin.whatsappModal.placeholder")}
               value={whatsappMessage}
               onChange={(e) => setWhatsappMessage(e.target.value)}
             />
             <div className="flex justify-end gap-3 mt-6">
               <Button 
                 variant="ghost" 
                 onClick={() => setWhatsappModal({ isOpen: false, phoneNumber: "", userName: "" })}
               >
                 {t("admin.whatsappModal.cancel")}
               </Button>
               <Button 
                 variant="primary" 
                 onClick={sendWhatsappMessage} 
                 disabled={!whatsappMessage.trim()}
               >
                 {t("admin.whatsappModal.send")}
               </Button>
             </div>
           </div>
         </div>
       )}

      {/* WhatsApp Modal */}
      {whatsappModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" dir={dir}>
            <h3 className="font-bold text-lg">{t("admin.whatsappModal.title", { name: whatsappModal.userName })}</h3>
            <Textarea
              className="w-full mt-4"
              placeholder={t("admin.whatsappModal.placeholder")}
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="ghost"
                onClick={() => setWhatsappModal({ isOpen: false, phoneNumber: "", userName: "" })}
              >
                {t("admin.whatsappModal.cancel")}
              </Button>
              <Button variant="primary" onClick={sendWhatsappMessage} disabled={!whatsappMessage.trim()}>
                {t("admin.whatsappModal.send")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagementTable
