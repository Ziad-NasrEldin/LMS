import { useTranslation } from "react-i18next"
import { BookOpen, Code, Database, PieChart, Palette, Briefcase, Brain, Globe, Microscope, Calculator } from 'lucide-react'

export default function CourseCategories() {
  const { t } = useTranslation("dashboard")
  
  // Mock data for categories with icons
  const categories = [
    { id: 1, name: t("categories.science"), icon: <Microscope className="h-6 w-6" />, count: 15 },
    { id: 2, name: t("categories.programming"), icon: <Code className="h-6 w-6" />, count: 23 },
    { id: 3, name: t("categories.biology"), icon: <Brain className="h-6 w-6" />, count: 12 },
    { id: 4, name: t("categories.design"), icon: <Palette className="h-6 w-6" />, count: 18 },
    { id: 5, name: t("categories.business"), icon: <Briefcase className="h-6 w-6" />, count: 14 },
    { id: 6, name: t("categories.math"), icon: <Calculator className="h-6 w-6" />, count: 19 },
    { id: 7, name: t("categories.data"), icon: <Database className="h-6 w-6" />, count: 21 },
    { id: 8, name: t("categories.languages"), icon: <Globe className="h-6 w-6" />, count: 16 },
    { id: 9, name: t("categories.statistics"), icon: <PieChart className="h-6 w-6" />, count: 11 },
    { id: 10, name: t("categories.education"), icon: <BookOpen className="h-6 w-6" />, count: 25 }
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {categories.map((category) => (
        <div 
          key={category.id} 
          className="card bg-base-100 shadow-md hover:shadow-lg duration-300 transition-shadow cursor-pointer"
        >
          <div className="card-body items-center text-center p-4">
            <div className="text-primary mb-2">
              {category.icon}
            </div>
            <h3 className="font-medium text-sm">{category.name}</h3>
            <p className="text-xs text-base-content/70">{t("courses_count", { count: category.count })}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
