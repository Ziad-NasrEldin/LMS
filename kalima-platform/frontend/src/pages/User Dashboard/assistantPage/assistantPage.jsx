"use client"

import { useState, useEffect } from "react"
import { getUserDashboard } from "../../../routes/auth-services"
import {
  BookOpen,
  FileText,
  Layers,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
  XCircle,
  GraduationCap,
  FileCheck,
  Eye,
  Paperclip,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { translateErrorMessage } from "../../../utils/errorTranslator"
import Button from "../../../components/ui/Button"
import Input from "../../../components/ui/Input"

const AssistantPage = () => {
  const { t, i18n } = useTranslation("assistantPage")
  const isRTL = i18n.language === "ar"

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [activeTab, setActiveTab] = useState("containers")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const result = await getUserDashboard()
        if (result.success) {
          setDashboardData(result.data.data)
        } else {
          setError(translateErrorMessage(result.error || t("errors.fetchFailed"), t))
        }
      } catch (err) {
        setError(t("errors.occurred"))
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [t])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const filterData = (data, term) => {
    if (!term) return data

    return data.filter((item) => {
      const searchableText = [item.name, item.description, item.subject?.name, item.level?.name, item.type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchableText.includes(term.toLowerCase())
    })
  }

  const paginateData = (data, page, perPage) => {
    const startIndex = (page - 1) * perPage
    return data.slice(startIndex, startIndex + perPage)
  }

  const renderPagination = (totalItems) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    if (totalPages <= 1) return null

    return (
      <div className="flex justify-center mt-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            let pageNum
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "primary" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </Button>
            )
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    )
  }

  const renderContainers = () => {
    if (!dashboardData?.lecturerContainers) return null

    const filteredContainers = filterData(dashboardData.lecturerContainers, searchTerm)
    const paginatedContainers = paginateData(filteredContainers, currentPage, itemsPerPage)

    return (
      <div dir={isRTL ? "rtl" : "ltr"}>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {t("containers.title")} ({filteredContainers.length})
          </h2>
        </div>

         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="border-b border-slate-200 bg-slate-50">
                 <th className="p-3 font-semibold text-sm">{t("common.name")}</th>
                 <th className="p-3 font-semibold text-sm">{t("common.type")}</th>
                 <th className="p-3 font-semibold text-sm">{t("common.subject")}</th>
                 <th className="p-3 font-semibold text-sm">{t("common.level")}</th>
                 <th className="p-3 font-semibold text-sm">{t("common.price")}</th>
                 <th className="p-3 font-semibold text-sm">{t("common.actions")}</th>
               </tr>
             </thead>
             <tbody>
               {paginatedContainers.map((container) => (
                 <tr key={container._id} className="border-b border-slate-100 hover:bg-slate-100 transition-colors">
                   <td className="p-3 font-medium text-sm">{container.name}</td>
                   <td className="p-3">
                     <span className="px-2 py-1 text-xs font-medium border border-slate-300 rounded-full capitalize">{t(`common.${container.type}`)} </span>
                   </td>
                   <td className="p-3 text-sm">{container.subject?.name || t("common.notAvailable")}</td>
                   <td className="p-3 text-sm">{container.level?.name || t("common.notAvailable")}</td>
                   <td className="p-3 text-sm">
                     {container.price > 0 ? t("common.pricePoints", { price: container.price }) : t("common.free")}
                   </td>
                   <td className="p-3">
                     <Button 
                       size="sm" 
                       variant="primary"
                       onClick={() => navigate(`/dashboard/assistant-page/container-details/${container._id}`)}
                     >
                       {t("common.details")}
                     </Button>
                   </td>
                 </tr>
               ))}
               {paginatedContainers.length === 0 && (
                 <tr>
                   <td colSpan="6" className="text-center py-4 text-sm">
                     {t("containers.notFound")}
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>

        {renderPagination(filteredContainers.length)}
      </div>
    )
  }

  const renderLectures = () => {
    if (!dashboardData?.lectures) return null

    const filteredLectures = filterData(dashboardData.lectures, searchTerm)
    const paginatedLectures = paginateData(filteredLectures, currentPage, itemsPerPage)

    return (
      <div dir={isRTL ? "rtl" : "ltr"}>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {t("lectures.title")} ({filteredLectures.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {paginatedLectures.map((lecture) => (
             <div key={lecture._id} className="rounded-xl bg-white shadow-sm border border-slate-200">
               <div className="p-4">
                 <div className="flex justify-between items-start">
                   <h3 className="text-base font-bold line-clamp-1">{lecture.name}</h3>
                   <div className={`px-2 py-1 text-xs font-medium rounded-full ${Number(lecture.price || 0) > 0 ? "bg-primary text-white" : "bg-secondary text-white"}`}>
                     {Number(lecture.price || 0) > 0 ? t("common.paid") : t("common.free")}
                   </div>
                 </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{lecture.description || t("common.noDescription")}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                   <span className="flex items-center gap-1">
                     <Eye className="w-3 h-3 flex-shrink-0" />
                     {t("lectures.views", { count: lecture.numberOfViews || 0 })}
                   </span>
                   <span className="flex items-center gap-1">
                     <GraduationCap className="w-3 h-3 flex-shrink-0" />
                     {lecture.subject?.name || t("common.noSubject")}
                   </span>
                   {lecture.level && (
                     <span className="flex items-center gap-1">
                       <Layers className="w-3 h-3 flex-shrink-0" />
                       {lecture.level.name}
                     </span>
                   )}
                   {lecture.requiresExam && (
                     <span className="flex items-center gap-1 text-blue-600">
                       <FileCheck className="w-3 h-3 flex-shrink-0" />
                       {t("lectures.hasExam")}
                     </span>
                   )}
                 </div>
                 <Button
                   size="sm"
                   variant="outline"
                   className="w-full mt-3"
                   onClick={() => navigate(`/dashboard/assistant-page/detailed-lecture-view/${lecture._id}`)}
                 >
                   {t("lectures.viewData")}
                 </Button>
                 <Button
                   size="sm"
                   variant="outline"
                   className="w-full mt-3"
                   onClick={() => navigate(`/dashboard/assistant-page/lecture-display/${lecture._id}`)}
                 >
                   {t("lectures.goToLecture")}
                 </Button>
               </div>
             </div>
           ))}
          {paginatedLectures.length === 0 && (
            <div className="col-span-full text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p>{t("lectures.notFound")}</p>
            </div>
          )}
        </div>

        {renderPagination(filteredLectures.length)}
      </div>
    )
  }

  const renderAttachments = () => {
    if (!dashboardData?.attachments) return null

    const filteredAttachments = dashboardData.attachments.filter(
      (attachment) => !searchTerm || attachment.fileName.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    const paginatedAttachments = paginateData(filteredAttachments, currentPage, itemsPerPage)

    return (
      <div dir={isRTL ? "rtl" : "ltr"}>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {t("attachments.title")} ({filteredAttachments.length})
          </h2>
        </div>

         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="border-b border-slate-200 bg-slate-50">
                 <th className="p-3 font-semibold text-sm">{t("attachments.fileName")}</th>
                 <th className="p-3 font-semibold text-sm">{t("common.lecture")}</th>
                 <th className="p-3 font-semibold text-sm">{t("common.type")}</th>
                 <th className="p-3 font-semibold text-sm">{t("attachments.uploadedOn")}</th>
                 <th className="p-3 font-semibold text-sm">{t("common.actions")}</th>
               </tr>
             </thead>
             <tbody>
               {paginatedAttachments.map((attachment) => (
                 <tr key={attachment._id} className="border-b border-slate-100 hover:bg-slate-100 transition-colors">
                   <td className="p-3 font-medium text-sm">{attachment.fileName}</td>
                   <td className="p-3 text-sm">{attachment.lectureId?.name || t("common.notAvailable")}</td>
                   <td className="p-3">
                     <span className="px-2 py-1 text-xs font-medium border border-slate-300 rounded-full capitalize">{t(`common.${attachment.type}`)}</span>
                   </td>
                   <td className="p-3 text-sm">{new Date(attachment.uploadedOn).toLocaleDateString(i18n.language)}</td>
                   <td className="p-3">
                     <a
                       href={attachment.filePath}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                     >
                       <FileText className="w-4 h-4 mr-1" />
                       {t("common.view")}
                     </a>
                   </td>
                 </tr>
               ))}
               {paginatedAttachments.length === 0 && (
                 <tr>
                   <td colSpan="5" className="text-center py-4 text-sm">
                     {t("attachments.notFound")}
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>

        {renderPagination(filteredAttachments.length)}
      </div>
    )
  }

  const renderExamSubmissions = () => {
    if (!dashboardData?.examSubmissions) return null

    const filteredSubmissions = dashboardData.examSubmissions.filter(
      (submission) =>
        !searchTerm ||
        (submission.lecture?.name && submission.lecture.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (submission.student?.name && submission.student.name.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    const paginatedSubmissions = paginateData(filteredSubmissions, currentPage, itemsPerPage)

    return (
      <div dir={isRTL ? "rtl" : "ltr"}>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {t("examSubmissions.title")} ({filteredSubmissions.length})
          </h2>
        </div>

         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="border-b border-slate-200 bg-slate-50">
                 <th className="p-3 font-semibold text-sm">{t("common.student")}</th>
                 <th className="p-3 font-semibold text-sm">{t("common.lecture")}</th>
                 <th className="p-3 font-semibold text-sm">{t("common.score")}</th>
                 <th className="p-3 font-semibold text-sm">{t("common.status")}</th>
                 <th className="p-3 font-semibold text-sm">{t("common.submittedAt")}</th>
               </tr>
             </thead>
             <tbody>
               {paginatedSubmissions.map((submission) => (
                 <tr key={submission._id} className="border-b border-slate-100 hover:bg-slate-100 transition-colors">
                   <td className="p-3 font-medium text-sm">{submission.student?.name || t("common.unknown")}</td>
                   <td className="p-3 text-sm">{submission.lecture?.name || t("common.unknown")}</td>
                   <td className="p-3 text-sm">
                     {t("common.scoreFormat", {
                       score: submission.score,
                       maxScore: submission.maxScore,
                       percentage: Math.round((submission.score / submission.maxScore) * 100),
                     })}
                   </td>
                   <td className="p-3 text-sm">
                     {submission.passed ? (
                       <span className="flex items-center text-green-600">
                         <CheckCircle className="w-4 h-4 mr-1" />
                         {t("common.passed")}
                       </span>
                     ) : (
                       <span className="flex items-center text-red-600">
                         <XCircle className="w-4 h-4 mr-1" />
                         {t("common.failed")}
                       </span>
                     )}
                   </td>
                   <td className="p-3 text-sm">{new Date(submission.submittedAt).toLocaleString(i18n.language)}</td>
                 </tr>
               ))}
               {paginatedSubmissions.length === 0 && (
                 <tr>
                   <td colSpan="5" className="text-center py-4 text-sm">
                     {t("examSubmissions.notFound")}
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>

        {renderPagination(filteredSubmissions.length)}
      </div>
    )
  }

  const renderHomeworkSubmissions = () => {
    if (!dashboardData?.homeworkSubmissions) return null

    const filteredSubmissions = dashboardData.homeworkSubmissions.filter(
      (submission) =>
        !searchTerm ||
        (submission.lecture?.name && submission.lecture.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (submission.student?.name && submission.student.name.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    const paginatedSubmissions = paginateData(filteredSubmissions, currentPage, itemsPerPage)

    return (
      <div dir={isRTL ? "rtl" : "ltr"}>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {t("homeworkSubmissions.title")} ({filteredSubmissions.length})
          </h2>
        </div>

         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="border-b border-slate-200 bg-slate-50">
                 <th className="p-3 font-semibold text-sm">{t("common.student")}</th>
                 <th className="p-3 font-semibold text-sm">{t("common.lecture")}</th>
                 <th className="p-3 font-semibold text-sm">{t("common.score")}</th>
                 <th className="p-3 font-semibold text-sm">{t("common.status")}</th>
                 <th className="p-3 font-semibold text-sm">{t("common.submittedAt")}</th>
               </tr>
             </thead>
             <tbody>
               {paginatedSubmissions.map((submission) => (
                 <tr key={submission._id} className="border-b border-slate-100 hover:bg-slate-100 transition-colors">
                   <td className="p-3 font-medium text-sm">{submission.student?.name || t("common.unknown")}</td>
                   <td className="p-3 text-sm">{submission.lecture?.name || t("common.unknown")}</td>
                   <td className="p-3 text-sm">
                     {t("common.scoreFormat", {
                       score: submission.score,
                       maxScore: submission.maxScore,
                       percentage: Math.round((submission.score / submission.maxScore) * 100),
                     })}
                   </td>
                   <td className="p-3 text-sm">
                     {submission.passed ? (
                       <span className="flex items-center text-green-600">
                         <CheckCircle className="w-4 h-4 mr-1" />
                         {t("common.passed")}
                       </span>
                     ) : (
                       <span className="flex items-center text-red-600">
                         <XCircle className="w-4 h-4 mr-1" />
                         {t("common.failed")}
                       </span>
                     )}
                   </td>
                   <td className="p-3 text-sm">{new Date(submission.submittedAt).toLocaleString(i18n.language)}</td>
                 </tr>
               ))}
               {paginatedSubmissions.length === 0 && (
                 <tr>
                   <td colSpan="5" className="text-center py-4 text-sm">
                     {t("homeworkSubmissions.notFound")}
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>

        {renderPagination(filteredSubmissions.length)}
      </div>
    )
  }

  const renderStats = () => {
    if (!dashboardData?.stats) return null

    const stats = [
      {
        title: t("stats.totalLectures"),
        value: dashboardData.stats.totalLectures,
        icon: <BookOpen className="w-6 h-6 text-blue-500" />,
        color: "bg-blue-100",
      },
      {
        title: t("stats.lectureViews"),
        value: dashboardData.stats.lectureViews,
        icon: <Eye className="w-6 h-6 text-green-500" />,
        color: "bg-green-100",
      },
      {
        title: t("stats.examSubmissions"),
        value: dashboardData.stats.totalStudentExamSubmissions,
        icon: <FileCheck className="w-6 h-6 text-purple-500" />,
        color: "bg-purple-100",
      },
      {
        title: t("stats.homeworkSubmissions"),
        value: dashboardData.stats.totalStudentHomeworkSubmissions,
        icon: <FileText className="w-6 h-6 text-orange-500" />,
        color: "bg-orange-100",
      },
      {
        title: t("stats.attachments"),
        value: dashboardData.stats.totalAttachments,
        icon: <Paperclip className="w-6 h-6 text-red-500" />,
        color: "bg-red-100",
      },
    ]

    return (
      <div dir={isRTL ? "rtl" : "ltr"}>
        <h2 className="text-xl font-semibold mb-4">{t("stats.title")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
           {stats.map((stat, index) => (
             <div key={index} className="rounded-xl bg-white shadow-sm border border-slate-200">
               <div className="p-4">
                 <div className="flex items-center gap-3">
                   <div className={`p-3 rounded-full ${stat.color}`}>{stat.icon}</div>
                   <div>
          <h3 className="text-sm font-medium text-slate-700">{stat.title}</h3>
                     <p className="text-2xl font-bold">{stat.value}</p>
                   </div>
                 </div>
               </div>
             </div>
           ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
           <div className="flex flex-col items-center">
             <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-4 text-lg">{t("common.loading")}</p>
           </div>
      </div>
    )
  }

  if (error) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm max-w-md">
           <XCircle className="w-6 h-6 flex-shrink-0" />
           <span>{error}</span>
         </div>
       </div>
     )
  }

  if (!dashboardData) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 shadow-sm max-w-md">
           <span>{t("errors.noData")}</span>
         </div>
       </div>
     )
  }

  return (
    <div className="container mx-auto px-4 py-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header with user info */}
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
         <div className="flex flex-col md:flex-row md:items-center gap-4">
           <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white text-xl font-bold">
             {dashboardData.userInfo.name.charAt(0)}
           </div>
           <div className="flex-1">
             <h1 className="text-2xl font-bold">{dashboardData.userInfo.name}</h1>
             <p className="text-slate-900/70">{dashboardData.userInfo.email}</p>
               <div className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary text-white mt-1">{t(`roles.${dashboardData.userInfo.role.toLowerCase()}`)}</div>
           </div>
           {dashboardData.userInfo.assignedLecturer && (
             <div className="bg-slate-100/50 p-4 rounded-lg flex flex-col md:flex-row items-start md:items-center gap-3">
               <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary text-white text-lg font-bold">
                 {dashboardData.userInfo.assignedLecturer.name.charAt(0)}
               </div>
               <div>
                 <h2 className="text-lg font-semibold">{dashboardData.userInfo.assignedLecturer.name}</h2>
                 <p className="text-sm text-slate-900/70">
                   {t(`roles.${dashboardData.userInfo.assignedLecturer.role.toLowerCase()}`)}
                 </p>
                 <p className="text-sm">
                   <span className="font-medium">{t("common.expertise")}:</span>{" "}
                   {dashboardData.userInfo.assignedLecturer.expertise}
                 </p>
               </div>
             </div>
           )}
         </div>
       </div>

      {/* Stats */}
      {renderStats()}

      {/* Search */}
       <div className="my-4">
         <div className="flex items-center gap-2">
           <Input
             type="text"
             placeholder={t("common.search")}
             className="w-full"
             value={searchTerm}
             onChange={handleSearch}
           />
           <Button variant="outline" size="sm" className="px-3">
             <Search className="w-5 h-5" />
           </Button>
         </div>
       </div>

      {/* Tabs */}
       <div className="flex p-1 bg-slate-100 rounded-xl my-6 w-fit" dir={isRTL ? "rtl" : "ltr"}>
         <button
           className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "containers" ? "bg-white shadow-sm text-primary" : "text-slate-600 hover:text-slate-900"}`}
           onClick={() => handleTabChange("containers")}
         >
           <Layers className="w-4 h-4" />
           {t("tabs.containers")}
         </button>
         <button
           className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "lectures" ? "bg-white shadow-sm text-primary" : "text-slate-600 hover:text-slate-900"}`}
           onClick={() => handleTabChange("lectures")}
         >
           <BookOpen className="w-4 h-4" />
           {t("tabs.lectures")}
         </button>
         <button
           className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "attachments" ? "bg-white shadow-sm text-primary" : "text-slate-600 hover:text-slate-900"}`}
           onClick={() => handleTabChange("attachments")}
         >
           <Paperclip className="w-4 h-4" />
           {t("tabs.attachments")}
         </button>
         <button
           className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "examSubmissions" ? "bg-white shadow-sm text-primary" : "text-slate-600 hover:text-slate-900"}`}
           onClick={() => handleTabChange("examSubmissions")}
         >
           <FileCheck className="w-4 h-4" />
           {t("tabs.examSubmissions")}
         </button>
         <button
           className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "homeworkSubmissions" ? "bg-white shadow-sm text-primary" : "text-slate-600 hover:text-slate-900"}`}
           onClick={() => handleTabChange("homeworkSubmissions")}
         >
           <FileText className="w-4 h-4" />
           {t("tabs.homeworkSubmissions")}
         </button>
       </div>

      {/* Tab Content */}
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {activeTab === "containers" && renderContainers()}
        {activeTab === "lectures" && renderLectures()}
        {activeTab === "attachments" && renderAttachments()}
        {activeTab === "examSubmissions" && renderExamSubmissions()}
        {activeTab === "homeworkSubmissions" && renderHomeworkSubmissions()}
      </div>
    </div>
  )
}

export default AssistantPage
