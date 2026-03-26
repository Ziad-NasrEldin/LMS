const fs = require('fs');

const f1 = 'E:/GitHub/fekra/kalima-platform/frontend/src/pages/Lecturer Dashboard/CourseGrid.jsx';
let code1 = fs.readFileSync(f1, 'utf8');

const ccStart = code1.indexOf('const CourseCard = memo(function CourseCard({');
const ccEndText = '\n})\n';
const ccEnd = code1.indexOf(ccEndText, ccStart);

const newCourseCard = \const CourseCard = memo(function CourseCard({
  container,
  index,
  stats,
  getContainerTypeTranslation,
  getContainerImage,
  onDelete,
  loading,
  t,
  isRTL,
}) {
  return (
    <div className={\\\card bg-base-100 shadow-[0_6px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition-all duration-300 rounded-3xl overflow-hidden h-full flex flex-col \\\\}>
      <figure className="relative h-48 w-full p-2 flex-shrink-0">
        <img
          src={getContainerImage(container, index) || "/placeholder.svg"}
          alt={container.name}
          className="w-full h-full object-cover rounded-2xl"
          loading="lazy"
        />
        {container.price > 0 ? (
          <div className="absolute bottom-5 left-5 bg-primary/95 backdrop-blur-sm text-primary-content px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm">
            {container.price} {t("currency")}
          </div>
        ) : (
          <div className="absolute bottom-5 left-5 bg-[#2ecc71]/95 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm">
            {t("free")}
          </div>
        )}
      </figure>

      <div className="card-body p-5 md:p-6 flex-grow flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="card-title text-lg md:text-xl font-bold text-base-content line-clamp-1">{container.name}</h3>
          <div className="badge badge-outline border-base-200 text-neutral font-medium px-3 py-3 rounded-full whitespace-nowrap">{getContainerTypeTranslation(container.type)}</div>
        </div>

        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-center gap-2 text-sm text-neutral font-medium">
            <User className="h-4 w-4 text-info flex-shrink-0" />
            <span className="truncate">{container.createdBy?.name || t("unknown")}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-neutral font-medium">
            <BookOpen className="h-4 w-4 text-info flex-shrink-0" />
            <span className="truncate">{container.subject?.name || t("unspecified")}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-neutral font-medium">
            <Star className="h-4 w-4 text-info flex-shrink-0" />
            <span className="truncate">{container.level?.name || t("unspecified")}</span>
          </div>
        </div>

        <div className="divider my-1 opacity-50"></div>

        <div className="flex justify-between text-xs text-neutral font-medium">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 flex-shrink-0 text-info" />
            <span>
              {stats.students} {t("student")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4 flex-shrink-0 text-info" />
            <span>
              {stats.lectures} {t("content")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 flex-shrink-0 text-info" />
            <span>{stats.duration}</span>
          </div>
        </div>

        <div className={\\\mt-auto pt-4 flex flex-row items-center justify-between gap-3 \\\\}>
          <button 
            className="btn bg-[#e84157] hover:bg-[#d63a4e] text-white border-none rounded-full min-h-10 h-10 px-5 shrink-0 transition-transform hover:scale-105" 
            onClick={() => onDelete(container._id)} 
            disabled={loading}
          >
             {t("delete")}
          </button>
          <Link to={\\\container-details/\\\\} className="w-full">
            <button className="btn btn-ghost bg-base-200 hover:bg-base-300 border-none rounded-full min-h-10 h-10 w-full flex items-center justify-center transition-colors">
              <Eye className="h-4 w-4 mx-1" />
              <span className="font-semibold">{t("view")}</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}\;
if (ccStart > -1 && ccEnd > -1) {
  code1 = code1.substring(0, ccStart) + newCourseCard + code1.substring(ccEnd + 3);
}

const headerOld = \<div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">{t("courseManagement")}</h2>
        <Link to="/dashboard/lecturer-dashboard/CoursesForm">
          <button className="btn btn-primary btn-base rounded-xl">
            <span>{t("addNewCourse")}</span>
          </button>
        </Link>
      </div>\;
const headerNew = \<div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-primary">{t("courseManagement")}</h2>
        <Link to="/dashboard/lecturer-dashboard/CoursesForm">
          <button className="btn bg-primary text-primary-content border-none hover:bg-primary/90 hover:scale-105 transition-transform rounded-full px-6 h-11 min-h-11">
            <Plus size={18} className="mr-1" />
            <span>{t("addNewCourse")}</span>
          </button>
        </Link>
      </div>\;
code1 = code1.replace(headerOld, headerNew);
fs.writeFileSync(f1, code1);

const f2 = 'E:/GitHub/fekra/kalima-platform/frontend/src/pages/Lecturer Dashboard/InstructorsList.jsx';
let code2 = fs.readFileSync(f2, 'utf8');

const s2OldStart = \<div className="p-4 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <h2 className="text-2xl font-bold break-words">{t("assistants")}</h2>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary gap-2 w-full sm:w-auto">
          <Plus size={18} />
          {t("addAssistant")}
        </button>
      </div>\;

const s2NewStart = \<div className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-primary break-words">{t("assistants")}</h2>
        <button onClick={() => setShowAddModal(true)} className="btn bg-primary text-primary-content border-none hover:bg-primary/90 hover:scale-105 transition-transform rounded-full px-6 h-11 min-h-11 gap-2 w-full sm:w-auto">
          <Plus size={18} />
          {t("addAssistant")}
        </button>
      </div>\;

const listOldEmpty = \{assistants?.length === 0 ? (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body items-center text-center py-12">
            <BookOpen className="text-primary" size={48} />
            <p className="text-lg">{t("noAssistants")}</p>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary mt-4 gap-2 w-full sm:w-auto">
              <Plus size={18} />
              {t("addYourFirstAssistant")}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" dir={isRTL ? "rtl" : "ltr"}>\;

const listNewEmpty = \{assistants?.length === 0 ? (
        <div className="card bg-base-100 shadow-[0_6px_16px_rgba(0,0,0,0.06)] rounded-3xl border border-base-200">
          <div className="card-body items-center text-center py-16">
            <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="text-neutral/40" size={40} />
            </div>
            <p className="text-lg text-neutral font-medium">{t("noAssistants")}</p>
            <button onClick={() => setShowAddModal(true)} className="btn bg-primary text-primary-content border-none hover:bg-primary/90 rounded-full px-6 mt-6 gap-2 w-full sm:w-auto">
              <Plus size={18} />
              {t("addYourFirstAssistant")}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8" dir={isRTL ? "rtl" : "ltr"}>\;

// Assistant Map part replacement
const mapOld = \{assistants?.map((assistant) => (
            <div key={assistant._id} className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={\\\bsolute top-2 z-10 flex gap-2 \\\\}>
                <button
                  onClick={() => startEdit(assistant)}
                  className="btn btn-sm btn-circle btn-ghost"
                  title={t("editAssistant")}
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => confirmDelete(assistant._id)}
                  className="btn btn-sm btn-circle btn-ghost text-error"
                  title={t("delete")}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="card-body items-center text-center p-5 sm:p-6">
                <div className="avatar mb-3">
                  <div className="w-20 rounded-full bg-base-200">
                    {assistant.image ? (
                      <img src={assistant.image || "/placeholder.svg"} alt={assistant.name} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-2xl font-bold">
                        {assistant.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="card-title">{assistant.name}</h3>
                <p className="text-sm opacity-70">{assistant.assignedLecturer?.expertise || t("assistantSpecialty")}</p>
                <div className="mt-2">
                  <span className={\\\adge \\\\}>
                    {assistant.gender === "male" ? t("male") : t("female")}
                  </span>
                </div>
              </div>
            </div>
          ))}\;

const mapNew = \{assistants?.map((assistant) => (
            <div key={assistant._id} className="card bg-base-100 shadow-[0_6px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 rounded-3xl relative">
              <div className={\\\bsolute top-4 z-10 flex gap-1 \\\\}>
                <button
                  onClick={() => confirmDelete(assistant._id)}
                  className="btn btn-sm btn-circle btn-ghost text-[#e84157] hover:bg-[#e84157]/10"
                  title={t("delete")}
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => startEdit(assistant)}
                  className="btn btn-sm btn-circle btn-ghost text-neutral hover:bg-base-200"
                  title={t("editAssistant")}
                >
                  <Edit size={18} />
                </button>
              </div>
              <div className="card-body items-center text-center p-6 sm:p-8">
                <div className="avatar mb-4">
                  <div className="w-24 h-24 rounded-full bg-base-200 ring-[4px] ring-base-100 shadow-md">
                    {assistant.image ? (
                      <img src={assistant.image || "/placeholder.svg"} alt={assistant.name} className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full text-3xl font-extrabold text-primary">
                        {assistant.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="card-title text-xl font-bold text-base-content">{assistant.name}</h3>
                <p className="text-sm font-medium text-neutral">{assistant.assignedLecturer?.expertise || t("assistantSpecialty")}</p>
                <div className="mt-3">
                  <span className={\\\adge font-semibold px-4 py-3 rounded-full border-none \\\\}>
                     {assistant.gender === "male" ? t("male") : t("female")}
                  </span>
                </div>
              </div>
            </div>
          ))}\;

code2 = code2.replace(s2OldStart, s2NewStart);
code2 = code2.replace(listOldEmpty, listNewEmpty);
code2 = code2.replace(mapOld, mapNew);

fs.writeFileSync(f2, code2);
