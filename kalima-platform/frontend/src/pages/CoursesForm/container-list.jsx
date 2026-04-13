"use client"
import { ChevronDown, FileText } from "lucide-react"
import Button from "../../components/ui/Button"
import { CONTAINER_TYPES } from "./course-form-helpers"

function ContainerList({ courseStructure, isRTL, selectedParentId, setSelectedParentId, expandedItems, toggleExpand }) {
  const yearContainers = (courseStructure.containers || []).filter((c) => c.type === CONTAINER_TYPES.YEAR)
  const termContainers = (courseStructure.containers || []).filter((c) => c.type === CONTAINER_TYPES.TERM)
  const monthContainers = (courseStructure.containers || []).filter((c) => c.type === CONTAINER_TYPES.MONTH)

  return (
    <div className="space-y-6">
      {yearContainers?.length > 0 && (
        <div>
          <h3 className="text-base font-medium text-primary mb-2">{isRTL ? "السنوات الدراسية" : "Academic Years"}</h3>
          <div className="space-y-2">
            {yearContainers?.map((year) => (
              <div key={year.id} className="bg-slate-100 p-3 rounded-lg">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleExpand("year", year.id)}>
                  <div className="flex items-center">
                    <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${expandedItems[`year_${year.id}`] ? "rotate-180" : ""}`} />
                    <span>{year.name}</span>
                  </div>
                  <Button variant="ghost" size="xs" className="min-w-0 h-auto p-1" onClick={(e) => { e.stopPropagation(); setSelectedParentId(year.id) }}>
                    {selectedParentId === year.id ? <span className="text-primary text-xs">✓ {isRTL ? "محدد" : "Selected"}</span> : <span className="text-xs">{isRTL ? "تحديد" : "Select"}</span>}
                  </Button>
                </div>

                {expandedItems[`year_${year.id}`] && (
                  <div className="mt-2 pl-4 border-l-2 border-base-300">
                    {termContainers?.filter((term) => term.parent === year.id).length > 0 ? (
                      <div>
                        <h5 className="text-xs font-medium mb-1">{isRTL ? "الترم" : "Terms"}</h5>
                        <div className="space-y-1">
                          {termContainers?.filter((term) => term.parent === year.id).map((term) => (
                            <div key={term.id} className="bg-slate-50 p-2 rounded">
                              <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleExpand("term", term.id)}>
                                <div className="flex items-center">
                                  <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${expandedItems[`term_${term.id}`] ? "rotate-180" : ""}`} />
                                  <span className="text-xs">{term.name}</span>
                                </div>
                                <Button variant="ghost" size="xs" className="min-w-0 h-auto p-1" onClick={(e) => { e.stopPropagation(); setSelectedParentId(term.id) }}>
                                  {selectedParentId === term.id ? <span className="text-primary text-xs">✓</span> : <span className="text-xs">{isRTL ? "تحديد" : "Select"}</span>}
                                </Button>
                              </div>

                              {expandedItems[`term_${term.id}`] && (
                                <div className="mt-1 pl-2 border-l-2 border-slate-200">
                                  {monthContainers?.filter((month) => month.parent === term.id).length > 0 ? (
                                    <div>
                                      <h5 className="text-xs font-medium mb-1">{isRTL ? "الشهور" : "Months"}</h5>
                                      <div className="space-y-1">
                                        {monthContainers?.filter((month) => month.parent === term.id).map((month) => (
                                          <div key={month.id} className="bg-slate-100 p-1 rounded">
                                            <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleExpand("month", month.id)}>
                                              <div className="flex items-center">
                                                <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${expandedItems[`month_${month.id}`] ? "rotate-180" : ""}`} />
                                                <span className="text-xs">{month.name}</span>
                                              </div>
                                              <Button variant="ghost" size="xs" className="min-w-0 h-auto p-1" onClick={(e) => { e.stopPropagation(); setSelectedParentId(month.id) }}>
                                                {selectedParentId === month.id ? <span className="text-primary text-xs">✓</span> : <span className="text-xs">{isRTL ? "تحديد" : "Select"}</span>}
                                              </Button>
                                            </div>

                                            {expandedItems[`month_${month.id}`] && (
                                              <div className="mt-1 pl-2 border-l-2 border-slate-200">
                                                {(courseStructure.lectures || []).filter((lecture) => lecture.parent === month.id).length > 0 ? (
                                                  <div>
                                                    <h6 className="text-xs font-medium mb-1">{isRTL ? "المحاضرات" : "Lectures"}</h6>
                                                    <ul className="space-y-1">
                                                      {(courseStructure.lectures || []).filter((lecture) => lecture.parent === month.id).map((lecture) => (
                                                        <li key={lecture.id} className="flex items-center text-xs">
                                                          <FileText className="w-3 h-3 mr-1 text-primary" />
                                                          <span>{lecture.name}</span>
                                                        </li>
                                                      ))}
                                                    </ul>
                                                  </div>
                                                ) : (
                    <p className="text-xs text-slate-600">{isRTL ? "لا توجد محاضرات" : "No lectures yet"}</p>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                    <p className="text-xs text-slate-600">{isRTL ? "لا توجد شهور" : "No months yet"}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                    <p className="text-xs text-slate-600">{isRTL ? "لا توجد ترم" : "No terms yet"}</p>
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
