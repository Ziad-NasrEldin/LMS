"use client"
import { useState, useEffect } from "react"
import { getAllUsers, deleteUser, createUser } from "../../../../routes/fetch-users"
import { useTranslation } from "react-i18next"
import { FaSync, FaWhatsapp, FaEdit, FaDownload, FaFileExport, FaEye, FaTimes, FaCalculator } from "react-icons/fa"
import Pagination from "../../../../components/Pagination"
import CreateUserModal from "../CreateUserModal/CreateUserModal"
import EditUserModal from "../CreateUserModal/EditUserModal"
import { getUserDashboard } from "../../../../routes/auth-services"
import { RecalculateInvites } from "../../../../routes/market"

const UserManagementTable = () => {
  const { t, i18n } = useTranslation("admin")
  const isRTL = i18n.language === "ar"
  const dir = isRTL ? "rtl" : "ltr"

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
          const userRole = result.data.data.userInfo.role
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
        setUsers(result.data)
        setFilteredUsers(result.data)
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
        setError(response.message || t("admin.invites.refreshError") || "Error calculating invites data")
        alert(response.message || t("admin.invites.refreshError") || "Error calculating invites data")
      }
    } catch (error) {
      console.error("Error recalculating invites:", error)
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        t("admin.invites.refreshError") ||
        "Error calculating invites data"
      setError(errorMessage)
      alert(errorMessage)
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
        (!filters.name || user.name.toLowerCase().includes(filters.name.toLowerCase())) &&
        (!filters.phone || user.phoneNumber?.includes(filters.phone)) &&
        (!filters.role || user.role.toLowerCase() === filters.role.toLowerCase()) &&
        (!filters.status || getStatus(user) === filters.status) &&
        (filters.successfulInvites === "" ||
          (user.successfulInvites || 0) === Number.parseInt(filters.successfulInvites, 10)),
    )
    setFilteredUsers(filtered)
  }

  const getRoleLabel = (role) => t(`admin.roles.${role.toLowerCase()}`)

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
        setError(result.error)
      }
    } catch (error) {
      setError(error.message)
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
        throw new Error(result.error)
      }
    } catch (error) {
      setError(error.message)
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
  const convertToCSV = (data) => {
    const headers = [
      t("admin.export.name"),
      t("admin.export.email"),
      t("admin.export.phone"),
      t("admin.export.role"),
      t("admin.export.status"),
      t("admin.export.government"),
      t("admin.export.administrationZone"),
      t("admin.export.sequenceId"),
      t("admin.export.joinedDate"),
    ]
    const csvContent = [
      headers.join(","),
      ...data.map((user) =>
        [
          `"${user.name || ""}"`,
          `"${user.email || ""}"`,
          `"${user.phoneNumber || ""}"`,
          `"${getRoleLabel(user.role)}"`,
          `"${getStatus(user)}"`,
          `"${user.government || ""}"`,
          `"${user.administrationZone || ""}"`,
          `"${user.sequencedId || ""}"`,
          `"${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}"`,
        ].join(","),
      ),
    ].join("\n")
    return csvContent
  }

  const exportToCSV = async (exportAll = false) => {
    setIsExporting(true)
    try {
      const dataToExport = exportAll ? users : filteredUsers
      const csvContent = convertToCSV(dataToExport)
      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        const timestamp = new Date().toISOString().split("T")[0]
        const filename = exportAll ? `all-users-${timestamp}.csv` : `filtered-users-${timestamp}.csv`
        link.setAttribute("download", filename)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        // Show success message
        const successMessage = exportAll
          ? t("admin.export.successAll", { count: dataToExport.length })
          : t("admin.export.successFiltered", { count: dataToExport.length })
        // You can replace this with a toast notification if you have one
        alert(successMessage)
      }
    } catch (error) {
      console.error("Export error:", error)
      alert(t("admin.export.error"))
    } finally {
      setIsExporting(false)
    }
  }

  const exportToJSON = async (exportAll = false) => {
    setIsExporting(true)
    try {
      const dataToExport = exportAll ? users : filteredUsers
      // Clean and format data for JSON export
      const jsonData = dataToExport.map((user) => ({
        name: user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        role: user.role || "",
        status: getStatus(user),
        government: user.government || "",
        administrationZone: user.administrationZone || "",
        sequenceId: user.sequencedId || "",
        joinedDate: user.createdAt ? new Date(user.createdAt).toISOString() : "",
        level: user.level || "",
        expertise: user.expertise || "",
      }))
      const jsonContent = JSON.stringify(jsonData, null, 2)
      // Create blob and download
      const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
      const link = document.createElement("a")
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        const timestamp = new Date().toISOString().split("T")[0]
        const filename = exportAll ? `all-users-${timestamp}.json` : `filtered-users-${timestamp}.json`
        link.setAttribute("download", filename)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        // Show success message
        const successMessage = exportAll
          ? t("admin.export.successAll", { count: dataToExport.length })
          : t("admin.export.successFiltered", { count: dataToExport.length })
        alert(successMessage)
      }
    } catch (error) {
      console.error("Export error:", error)
      alert(t("admin.export.error"))
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
      switch (user.role.toLowerCase()) {
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
                {user.hobbies && user.hobbies.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("admin.userDetails.hobbies")}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {user.hobbies.map((hobby, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
    <div className="rounded-xl font-sans w-full mx-auto p-4 my-14 border border-primary" dir={dir}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isRTL ? "text-right" : "text-left"}`}>
            {t("admin.userManagement.title")}
          </h1>
          <p className="text-base-content/70">{t("admin.userManagement.subtitle") || "Manage and export user data"}</p>
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
              <span>{t("admin.export.csvFormat")}</span>
            </li>
            <li>
              <button onClick={() => exportToCSV(false)} disabled={isExporting || filteredUsers.length === 0}>
                <FaFileExport className="mr-2" />
                {t("admin.export.exportFiltered")} ({filteredUsers.length})
              </button>
            </li>
            <li>
              <button onClick={() => exportToCSV(true)} disabled={isExporting || users.length === 0}>
                <FaFileExport className="mr-2" />
                {t("admin.export.exportAll")} ({users.length})
              </button>
            </li>
            <div className="divider my-1"></div>
            <li className="menu-title">
              <span>{t("admin.export.jsonFormat")}</span>
            </li>
            <li>
              <button onClick={() => exportToJSON(false)} disabled={isExporting || filteredUsers.length === 0}>
                <FaFileExport className="mr-2" />
                {t("admin.export.exportFiltered")} ({filteredUsers.length})
              </button>
            </li>
            <li>
              <button onClick={() => exportToJSON(true)} disabled={isExporting || users.length === 0}>
                <FaFileExport className="mr-2" />
                {t("admin.export.exportAll")} ({users.length})
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-wrap gap-4 mb-8 justify-between items-center">
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder={t("admin.filters.name")}
            className="input input-bordered"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
          <input
            type="text"
            placeholder={t("admin.filters.phone")}
            className="input input-bordered"
            value={filters.phone}
            onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
          />
          <select
            className="select select-bordered"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="">{t("admin.filters.allTypes")}</option>
            {["student", "parent", "lecturer", "Teacher", "moderator", "subAdmin"].map((role) => (
              <option key={role} value={role}>
                {t(`admin.roles.${role}`)}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">{t("admin.filters.allStatus")}</option>
            <option value={t("admin.status.valid")}>{t("admin.status.valid")}</option>
            <option value={t("admin.status.missingData")}>{t("admin.status.missingData")}</option>
          </select>
          <input
            type="number"
            min="0"
            placeholder={t("admin.filters.invites")}
            className="input input-bordered"
            value={filters.successfulInvites}
            onChange={(e) => setFilters({ ...filters, successfulInvites: e.target.value })}
          />
        </div>
        <div className="flex gap-4">
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            {t("admin.userManagement.createUser")}
          </button>
          <button className="btn btn-ghost" onClick={fetchUsers}>
            <FaSync />
          </button>
          <button className="btn btn-secondary" onClick={handleRecalculateInvites} disabled={isRecalculating}>
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
      <div className="w-full overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr className={`${isRTL ? "text-right" : "text-left"}`}>
              {["name", "phone", "accountType", "status", "successfulInvites", "actions"].map((header) => (
                <th key={header} className="pb-4 text-lg font-medium whitespace-nowrap">
                  {t(`admin.table.${header}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user._id} className={`${isRTL ? "text-right" : "text-left"} border-t`}>
                <td className="py-4 whitespace-nowrap">{user.name}</td>
                <td className="py-4 whitespace-nowrap">{user.phoneNumber || t("admin.NA")}</td>
                <td className="py-4 whitespace-nowrap">{getRoleLabel(user.role)}</td>
                <td className="py-4 whitespace-nowrap">{getStatus(user)}</td>
                <td className="py-4 whitespace-nowrap">{user.successfulInvites || 0}</td>
                <td className="py-4 whitespace-nowrap">
                  <div className={`flex items-center gap-2 ${isRTL ? "text-right" : "text-left"}`}>
                    <button
                      className="btn btn-primary btn-xs"
                      onClick={() => openUserDetailsModal(user)}
                      title={t("admin.actions.viewDetails")}
                    >
                      <FaEye />
                    </button>
                    {isAdmin | isSubAdmin && (
                      <button
                        className="btn btn-info btn-xs"
                        onClick={() => openEditModal(user)}
                        title={t("admin.actions.edit")}
                      >
                        <FaEdit />
                      </button>
                    )}
                    {user.phoneNumber && (
                      <button
                        className="btn btn-success btn-xs"
                        onClick={() => openWhatsappModal(user.phoneNumber, user.name)}
                        title={t("admin.actions.whatsapp")}
                      >
                        <FaWhatsapp />
                      </button>
                    )}
                    <button className="btn btn-error btn-xs" onClick={() => handleDelete(user._id)}>
                      {t("admin.actions.delete")}
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
