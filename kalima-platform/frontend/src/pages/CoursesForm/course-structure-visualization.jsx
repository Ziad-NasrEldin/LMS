import { FileText } from "lucide-react"

// Container types
const CONTAINER_TYPES = {
  COURSE: "course",
  YEAR: "year",
  TERM: "term",
  MONTH: "month",
  LECTURE: "lecture",
}

function CourseStructureVisualization({ courseStructure, isRTL }) {
  // Helper function to get container by ID
  const getContainerById = (id) => {
    return courseStructure.containers.find((c) => c.id === id)
  }

  // Helper function to get container type label
  const getContainerTypeLabel = (type) => {
    switch (type) {
      case CONTAINER_TYPES.COURSE:
        return isRTL ? "الحاوية الرئيسية" : "Parent Container"
      case CONTAINER_TYPES.YEAR:
        return isRTL ? "سنة دراسية" : "Academic Year"
      case CONTAINER_TYPES.TERM:
        return isRTL ? "فصل دراسي" : "Term"
      case CONTAINER_TYPES.MONTH:
        return isRTL ? "شهر" : "Month"
      default:
        return type
    }
  }

  // Filter containers by type
  const yearContainers = courseStructure.containers.filter((c) => c.type === CONTAINER_TYPES.YEAR)

  return (
    <div className="bg-base-100 rounded-xl shadow-md p-6">
      <h2 className="text-lg font-bold mb-6 text-primary text-center">
        {isRTL ? "هيكل المحتوى التعليمي" : "Educational Content Structure"}
      </h2>

      <div className="mb-6 bg-base-200 p-4 rounded-lg">
        <h3 className="text-base font-medium mb-3 text-primary">{isRTL ? "هيكل الكورس" : "Course Structure"}</h3>

        <div className="pl-4 border-l-2 border-primary">
          <div className="mb-2">
            <span className="font-medium">{courseStructure.parent.name}</span>
            <span className="text-xs text-base-content/70"> ({getContainerTypeLabel(CONTAINER_TYPES.COURSE)})</span>
          </div>

          {yearContainers.length > 0 && (
            <div className="pl-4 border-l-2 border-secondary">
              {yearContainers.map((year) => {
                // Get terms for this year
                const yearTerms = courseStructure.containers.filter(
                  (c) => c.type === CONTAINER_TYPES.TERM && c.parent === year.id,
                )

                return (
                  <div key={year.id} className="mb-2">
                    <div className="mb-1">
                      <span className="font-medium">{year.name}</span>
                      <span className="text-xs text-base-content/70">
                        {" "}
                        ({getContainerTypeLabel(CONTAINER_TYPES.YEAR)})
                      </span>
                    </div>

                    {yearTerms.length > 0 && (
                      <div className="pl-4 border-l-2 border-accent">
                        {yearTerms.map((term) => {
                          // Get months for this term
                          const termMonths = courseStructure.containers.filter(
                            (c) => c.type === CONTAINER_TYPES.MONTH && c.parent === term.id,
                          )

                          return (
                            <div key={term.id} className="mb-2">
                              <div className="mb-1">
                                <span className="font-medium">{term.name}</span>
                                <span className="text-xs text-base-content/70">
                                  {" "}
                                  ({getContainerTypeLabel(CONTAINER_TYPES.TERM)})
                                </span>
                              </div>

                              {termMonths.length > 0 && (
                                <div className="pl-4 border-l-2 border-info">
                                  {termMonths.map((month) => {
                                    // Get lectures for this month
                                    const monthLectures = courseStructure.lectures.filter(
                                      (lecture) => lecture.parent === month.id,
                                    )

                                    return (
                                      <div key={month.id} className="mb-2">
                                        <div className="mb-1">
                                          <span className="font-medium">{month.name}</span>
                                          <span className="text-xs text-base-content/70">
                                            {" "}
                                            ({getContainerTypeLabel(CONTAINER_TYPES.MONTH)})
                                          </span>
                                        </div>

                                        {monthLectures.length > 0 && (
                                          <div className="pl-4 border-l-2 border-success">
                                            {monthLectures.map((lecture) => (
                                              <div key={lecture.id} className="mb-1">
                                                <FileText className="w-3 h-3 inline-block mr-1 text-primary" />
                                                <span>{lecture.name}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseStructureVisualization
