"use client"
import { ChevronDown, FileText } from "lucide-react"

// Container types
const CONTAINER_TYPES = {
  COURSE: "course",
  YEAR: "year",
  TERM: "term",
  MONTH: "month",
  LECTURE: "lecture",
}

function ContainerList({ courseStructure, isRTL, selectedParentId, setSelectedParentId, expandedItems, toggleExpand }) {
  // Filter containers by type
  const yearContainers = courseStructure.containers.filter((c) => c.type === CONTAINER_TYPES.YEAR)
  const termContainers = courseStructure.containers.filter((c) => c.type === CONTAINER_TYPES.TERM)
  const monthContainers = courseStructure.containers.filter((c) => c.type === CONTAINER_TYPES.MONTH)

  return (
    <div className="space-y-6">
      {/* Year Containers */}
      {yearContainers.length > 0 && (
        <div>
          <h3 className="text-base font-medium text-primary mb-2">{isRTL ? "السنوات الدراسية" : "Academic Years"}</h3>
          <div className="space-y-2">
            {yearContainers.map((year) => (
              <div key={year.id} className="bg-base-200 p-3 rounded-lg">
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleExpand("year", year.id)}
                >
                  <div className="flex items-center">
                    <ChevronDown
                      className={`w-4 h-4 mr-2 transition-transform ${expandedItems[`year_${year.id}`] ? "rotate-180" : ""}`}
                    />
                    <span>{year.name}</span>
                  </div>
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedParentId(year.id)
                    }}
                  >
                    {selectedParentId === year.id ? (
                      <span className="text-primary text-xs">✓ {isRTL ? "محدد" : "Selected"}</span>
                    ) : (
                      <span className="text-xs">{isRTL ? "تحديد" : "Select"}</span>
                    )}
                  </button>
                </div>

                {expandedItems[`year_${year.id}`] && (
                  <div className="mt-2 pl-4 border-l-2 border-base-300">
                    {/* Terms under this year */}
                    {termContainers.filter((term) => term.parent === year.id).length > 0 ? (
                      <div>
                        <h4 className="text-sm font-medium mb-2">{isRTL ? "الفصول الدراسية" : "Terms"}</h4>
                        <div className="space-y-1">
                          {termContainers
                            .filter((term) => term.parent === year.id)
                            .map((term) => (
                              <div key={term.id} className="bg-base-100 p-2 rounded">
                                <div
                                  className="flex justify-between items-center cursor-pointer"
                                  onClick={() => toggleExpand("term", term.id)}
                                >
                                  <div className="flex items-center">
                                    <ChevronDown
                                      className={`w-3 h-3 mr-1 transition-transform ${expandedItems[`term_${term.id}`] ? "rotate-180" : ""}`}
                                    />
                                    <span className="text-sm">{term.name}</span>
                                  </div>
                                  <button
                                    className="btn btn-xs btn-ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedParentId(term.id)
                                    }}
                                  >
                                    {selectedParentId === term.id ? (
                                      <span className="text-primary text-xs">✓</span>
                                    ) : (
                                      <span className="text-xs">{isRTL ? "تحديد" : "Select"}</span>
                                    )}
                                  </button>
                                </div>

                                {expandedItems[`term_${term.id}`] && (
                                  <div className="mt-2 pl-3 border-l-2 border-base-300">
                                    {/* Months under this term */}
                                    {monthContainers.filter((month) => month.parent === term.id).length > 0 ? (
                                      <div>
                                        <h5 className="text-xs font-medium mb-1">{isRTL ? "الشهور" : "Months"}</h5>
                                        <div className="space-y-1">
                                          {monthContainers
                                            .filter((month) => month.parent === term.id)
                                            .map((month) => (
                                              <div key={month.id} className="bg-base-200 p-1 rounded">
                                                <div
                                                  className="flex justify-between items-center cursor-pointer"
                                                  onClick={() => toggleExpand("month", month.id)}
                                                >
                                                  <div className="flex items-center">
                                                    <ChevronDown
                                                      className={`w-3 h-3 mr-1 transition-transform ${expandedItems[`month_${month.id}`] ? "rotate-180" : ""}`}
                                                    />
                                                    <span className="text-xs">{month.name}</span>
                                                  </div>
                                                  <button
                                                    className="btn btn-xs btn-ghost"
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      setSelectedParentId(month.id)
                                                    }}
                                                  >
                                                    {selectedParentId === month.id ? (
                                                      <span className="text-primary text-xs">✓</span>
                                                    ) : (
                                                      <span className="text-xs">{isRTL ? "تحديد" : "Select"}</span>
                                                    )}
                                                  </button>
                                                </div>

                                                {expandedItems[`month_${month.id}`] && (
                                                  <div className="mt-1 pl-2 border-l-2 border-base-300">
                                                    {/* Lectures under this month */}
                                                    {courseStructure.lectures.filter(
                                                      (lecture) => lecture.parent === month.id,
                                                    ).length > 0 ? (
                                                      <div>
                                                        <h6 className="text-xs font-medium mb-1">
                                                          {isRTL ? "المحاضرات" : "Lectures"}
                                                        </h6>
                                                        <ul className="space-y-1">
                                                          {courseStructure.lectures
                                                            .filter((lecture) => lecture.parent === month.id)
                                                            .map((lecture) => (
                                                              <li
                                                                key={lecture.id}
                                                                className="flex items-center text-xs"
                                                              >
                                                                <FileText className="w-3 h-3 mr-1 text-primary" />
                                                                <span>{lecture.name}</span>
                                                              </li>
                                                            ))}
                                                        </ul>
                                                      </div>
                                                    ) : (
                                                      <p className="text-xs text-base-content/50">
                                                        {isRTL ? "لا توجد محاضرات" : "No lectures yet"}
                                                      </p>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-base-content/50">
                                        {isRTL ? "لا توجد شهور" : "No months yet"}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-base-content/50">{isRTL ? "لا توجد فصول دراسية" : "No terms yet"}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ContainerList
