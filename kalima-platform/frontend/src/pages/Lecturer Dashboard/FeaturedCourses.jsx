import { useTranslation } from "react-i18next"
import { User, Calendar, Clock, Heart } from "lucide-react"

export default function FeaturedCourses() {
  const { t } = useTranslation("dashboard")

  // Mock data for featured courses
  const featuredCourses = [
    {
      id: 1,
      title: "الدورة المتقدمة في الذكاء الاصطناعي",
      instructor: "أحمد علي",
      date: "15 مايو 2023",
      duration: "8 ساعات",
      image: "/course-1.png",
      tag: "جديد",
      isFavorite: true,
    },
    {
      id: 2,
      title: "أساسيات تصميم الجرافيك",
      instructor: "سارة محمد",
      date: "10 يونيو 2023",
      duration: "12 ساعة",
      image: "/course-2.png",
      tag: "شائع",
      isFavorite: false,
    },
    {
      id: 3,
      title: "الدورة المتقدمة في الفيزياء",
      instructor: "محمد خالد",
      date: "20 يوليو 2023",
      duration: "10 ساعات",
      image: "/course-3.png",
      tag: "جديد",
      isFavorite: false,
    },
    {
      id: 4,
      title: "الجغرافيا المتقدمة في الشرق الأوسط",
      instructor: "أحمد علي",
      date: "5 أغسطس 2023",
      duration: "6 ساعات",
      image: "/course-4.png",
      tag: "حصري",
      isFavorite: true,
    },
    {
      id: 5,
      title: "الدورة المتقدمة في التاريخ",
      instructor: "فاطمة أحمد",
      date: "12 سبتمبر 2023",
      duration: "9 ساعات",
      image: "/course-5.png",
      tag: "شائع",
      isFavorite: false,
    },
    {
      id: 6,
      title: "الدورة المتقدمة في الكيمياء",
      instructor: "علي محمد",
      date: "25 أكتوبر 2023",
      duration: "11 ساعة",
      image: "/course-6.png",
      tag: "جديد",
      isFavorite: true,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
      {featuredCourses.map((course) => (
        <div key={course.id} className="card bg-base-100 shadow-lg hover:shadow-2xl duration-300 transition-shadow">
          <figure className="relative">
            <img src={course.image || "/placeholder.svg"} alt={course.title} className="w-full h-48 object-cover" />
            <div className="absolute top-2 left-2">
              <span className="badge badge-primary">{course.tag}</span>
            </div>
            <button className="absolute top-2 right-2 btn btn-circle btn-sm bg-base-100/80">
              <Heart
                className={`h-4 w-4 ${course.isFavorite ? "fill-primary text-primary" : "text-base-content/70"}`}
              />
            </button>
          </figure>
          <div className="card-body p-4">
            <h3 className="card-title text-lg font-bold">{course.title}</h3>

            <div className="flex items-center gap-2 text-sm text-base-content/70 mt-2">
              <User className="h-4 w-4" />
              <span>{course.instructor}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-base-content/70 mt-1">
              <Calendar className="h-4 w-4" />
              <span>{course.date}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-base-content/70 mt-1">
              <Clock className="h-4 w-4" />
              <span>{course.duration}</span>
            </div>

            <div className="card-actions justify-between mt-3">
              <button className="btn btn-sm btn-primary">{t("enroll")}</button>
              <button className="btn btn-sm btn-outline">{t("details")}</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
