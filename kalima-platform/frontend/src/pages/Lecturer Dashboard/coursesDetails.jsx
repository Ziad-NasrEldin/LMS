import {
    FaCalendarAlt,
    FaCheck,
    FaClock,
  } from "react-icons/fa"
import { GraduationCap } from 'lucide-react';
  const CivilcoCourseComponent = () => {
    return (
      <div className="flex flex-col min-h-screen bg-white" dir="rtl">
        {/* Main Content */}
        <main className="flex-1">
          {/* Course Title Section */}
          <section className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
              {/* Course Title */}
              <div className="relative">
                <div className="relative w-full flex justify-center items-center mt-4 right-60">
                  <img src="/CDHback.png" alt="" className="h-16 w-auto" />
                  <img src="/CDs.png" alt="" className="absolute h-10 w-auto left-12 bottom-8" />
                  <h1 className="absolute text-5xl font-bold text-center bottom-10">كورساتي</h1>
                </div>

                <div className="absolute -bottom-1 top-9 right-0 w-32 h-4 bg-[#ffe492] -z-10"></div>
                <div className="mt-8">
                <div className="relative w-full bottom-12 flex justify-center items-center mt-4 right-60">
                    <img src="/CDborder.png" alt="" className="h-32 w-auto" />
                    <h2 className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
                        دورة تعلم اللغة الإنجليزية
                    </h2>
                </div>
                </div>
              </div>
            </div>
          </section>
  
          {/* Course Details Section */}
          <section className="container mx-auto px-4 py-4">
            <div className="flex flex-col-reverse md:flex-row gap-8 items-start">
              {/* Course Image*/}
              <div className="relative bottom-32 w-full md:w-2/3 order-2 md:order-1">
                <img src="/CDmain.png" alt="English Course" className=" w-4/5 mx-auto h-auto rounded-lg" />
              </div>
  
              {/* Course Info Card */}
              <div className="relative w-full md:w-[450px] order-1 md:order-2 left-20">
                <div className="card border border-t-4 border-l-4 border-primary h-[500px]">
                  <div className="border-b border-base-300 py-3 px-4">
                    <h3 className="text-4xl font-bold text-center">تفاصيل الكورس</h3>
                  </div>
                  <div className="card-body p-6 space-y-4">
                    <div className="flex justify-between text-3xl pt-5">
                      <span className="font-bold ">المدرس :</span>
                      <span>أ/يوسف عثمان</span>
                    </div>
                    <div className="flex justify-between text-3xl pt-5">
                      <span className="font-bold">عدد المحاضرات :</span>
                      <span>10</span>
                    </div>
                    <div className="flex justify-between text-3xl pt-5">
                      <span className="font-bold">الصف الدراسي :</span>
                      <span>الصف الثانوي</span>
                    </div>
                    <div className="flex justify-between text-3xl pt-5">
                      <span className="font-bold">المشاهدات :</span>
                      <span>1240 مشاهدة</span>
                    </div>
                  </div>
                </div>
                <div className="mt-16 flex justify-center">
                  <button className="btn btn-primary text-white px-8 py-3">
                    <span className="font-bold">اشترك الآن</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
  
          {/* Course Description */}
<section
  className="mx-auto  relative "
  >
    <img src="/CDback.png" alt="English Course" className="absolute w-4/5 mx-auto h-auto rounded-lg" />
  <div className="relative z-10 p-6 h-[500px]">
    <div className="mb-6">
      <h3 className="text-lg font-bold">اسم الدورة : اللغة الانجليزية</h3>
    </div>
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-2">وصف الدورة:</h3>
      <p className="leading-relaxed">
        تهدف هذه الدورة إلى تطوير مهارات المتعلمين في اللغة الإنجليزية من حيث القراءة، الكتابة، الاستماع،
        والتحدث. تشمل الدورة قواعد اللغة الأساسية، المفردات، والنطق، مع التركيز على استخدام اللغة في المواقف
        اليومية. المستوى: مبتدئ / متوسط (اختياري للمناسب)
      </p>
    </div>
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-2">المدة: (اكتب عدد الأسابيع أو الساعات)</h3>
    </div>
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-2">أهداف الدورة:</h3>
      <ul className="space-y-2">
        <li className="flex items-center gap-2">
          <FaCheck className="h-5 w-5 text-primary" />
          <span>تنمية المفردات وتحسين استخدام القواعد</span>
        </li>
        <li className="flex items-center gap-2">
          <FaCheck className="h-5 w-5 text-primary" />
          <span>تعزيز مهارات التحدث والاستماع بثقة</span>
        </li>
        <li className="flex items-center gap-2">
          <FaCheck className="h-5 w-5 text-primary" />
          <span>تحسين مهارات القراءة والفهم والكتابة</span>
        </li>
      </ul>
    </div>
  </div>
</section>

  
          {/* Course Plan */}
          <section className=" mx-auto px-4 py-8 ">
            <h3 className="text-4xl font-bold mb-6">خطة الكورس</h3>
            <div className="card border-none w-1/2">
              {/* October */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaCalendarAlt className="h-5 w-5" />
                  <h4 className="text-lg font-bold">شهر أكتوبر</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="text-primary p-4 w-20 h-20 flex items-center justify-center">
                      <GraduationCap />
                      </div>
                      <div>
                        <h5 className="font-bold">الدرس 1: الصفات والتعريف بالنفس</h5>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaClock className="h-4 w-4 text-primary" />
                      <span>24 Min</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                    <div className="text-primary p-4 w-20 h-20 flex items-center justify-center">
                      <GraduationCap />
                      </div>
                      <div>
                        <h5 className="font-bold">الدرس 2: الأرقام والألوان</h5>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaClock className="h-4 w-4 text-primary" />
                      <span>16 Min</span>
                    </div>
                  </div>
                </div>
              </div>
  
              {/* November */}
              <div className="p-6 border-t border-base-300">
                <div className="flex items-center gap-2 mb-4">
                  <FaCalendarAlt className="h-5 w-5" />
                  <h4 className="text-lg font-bold">شهر نوفمبر</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                    <div className="text-primary p-4 w-20 h-20 flex items-center justify-center">
                      <GraduationCap />
                      </div>
                      <div>
                        <h5 className="font-bold">الدرس 3: المحادثات اليومية في السوق</h5>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaClock className="h-4 w-4 text-primary" />
                      <span>30 Min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    )
  }
  
  export default CivilcoCourseComponent
  