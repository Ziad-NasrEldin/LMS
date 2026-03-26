import re, codecs

with codecs.open('kalima-platform/frontend/src/pages/Lecturer Dashboard/InstructorsList.jsx', 'r', 'utf8') as f:
    text = f.read()

text = text.replace('className="p-4 space-y-6"', 'className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto"')
text = text.replace('className="text-2xl font-bold break-words">{t("assistants")}</h2>', 'className="text-2xl md:text-3xl font-extrabold text-primary break-words">{t("assistants")}</h2>')
text = text.replace('className="btn btn-primary gap-2 w-full sm:w-auto"', 'className="btn bg-primary text-primary-content border-none hover:bg-primary/90 hover:scale-105 transition-transform rounded-full px-6 h-11 min-h-11 gap-2 w-full sm:w-auto"')

# Fix zero state map
text = text.replace('className="card bg-base-100 shadow-sm"', 'className="card bg-base-100 shadow-[0_6px_16px_rgba(0,0,0,0.06)] rounded-[2rem] border-base-200 border"')
text = text.replace('className="card-body items-center text-center py-12"', 'className="card-body items-center text-center py-16"')
text = text.replace('<BookOpen className="text-primary" size={48} />', '<div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mb-4"><BookOpen className="text-neutral/40" size={48} /></div>')

text = text.replace('className="btn btn-primary mt-4 gap-2 w-full sm:w-auto"', 'className="btn bg-primary text-primary-content border-none hover:bg-primary/90 rounded-full px-6 mt-6 gap-2 w-full sm:w-auto mx-auto"')


# Fix cards grid
text = text.replace('className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"', 'className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8"')
text = text.replace('className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"', 'className="card bg-base-100 shadow-[0_6px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 rounded-[2rem] relative"')

# Fix card body 
text = text.replace('className="card-body items-center text-center p-5 sm:p-6"', 'className="card-body items-center text-center p-6 sm:p-8"')

# Fix avatar
text = text.replace('className="w-20 rounded-full bg-base-200"', 'className="w-24 h-24 rounded-full bg-base-200 ring-[4px] ring-base-100 shadow-lg relative z-10"')
text = text.replace('<img src={assistant.image || "/placeholder.svg"} alt={assistant.name} />', '<img src={assistant.image || "/placeholder.svg"} alt={assistant.name} className="object-cover w-full h-full" />')

# Fix title
text = text.replace('className="card-title"', 'className="card-title text-xl font-bold text-base-content mt-2"')
text = text.replace('className="text-sm opacity-70"', 'className="text-sm font-medium text-neutral"')

# Fix buttons absolute position
text = text.replace('\bsolute top-2 z-10 flex gap-2', '\bsolute top-4 z-20 flex gap-1')

# fix icons button
text = text.replace('className="btn btn-sm btn-circle btn-ghost"', 'className="btn btn-sm btn-circle btn-ghost bg-base-200 hover:bg-base-300 border-none transition-colors"')
text = text.replace('className="btn btn-sm btn-circle btn-ghost text-error"', 'className="btn btn-sm btn-circle btn-ghost bg-[#e84157]/10 text-[#e84157] hover:bg-[#e84157]/20 border-none transition-colors"')


with codecs.open('kalima-platform/frontend/src/pages/Lecturer Dashboard/InstructorsList.jsx', 'w', 'utf8') as f:
    f.write(text)


######### CourseGrid.jsx ############
with codecs.open('kalima-platform/frontend/src/pages/Lecturer Dashboard/CourseGrid.jsx', 'r', 'utf8') as f:
    text2 = f.read()

text2 = text2.replace('<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">', '<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">')
text2 = text2.replace('<h2 className="text-2xl font-bold">{t("courseManagement")}</h2>', '<h2 className="text-2xl md:text-3xl font-extrabold text-primary">{t("courseManagement")}</h2>')
text2 = text2.replace('className="btn btn-primary btn-base rounded-xl"', 'className="btn bg-primary text-primary-content border-none hover:bg-primary/90 hover:scale-105 transition-transform rounded-full px-6 h-11 min-h-11"')

text2 = text2.replace('className={card bg-base-100 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col }', 'className={card bg-base-100 shadow-[0_6px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 rounded-[2rem] overflow-hidden h-full flex flex-col }')
text2 = text2.replace('className="relative h-48 w-full"', 'className="relative h-48 w-full p-2 flex-shrink-0"')
text2 = text2.replace('className="w-full h-full object-cover"', 'className="w-full h-full object-cover rounded-2xl"')
text2 = text2.replace('className="absolute top-2 left-2 badge badge-primary font-semibold"', 'className="absolute bottom-5 left-5 bg-primary/95 backdrop-blur-sm text-primary-content px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm border-none"')
text2 = text2.replace('className="absolute top-2 left-2 badge badge-success font-semibold"', 'className="absolute bottom-5 left-5 bg-[#2ecc71]/95 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm border-none"')

text2 = text2.replace('className="card-body p-4 flex-grow flex flex-col gap-3"', 'className="card-body p-5 md:p-6 flex-grow flex flex-col gap-4"')
text2 = text2.replace('className="card-title text-lg line-clamp-1"', 'className="card-title text-base md:text-lg font-bold text-base-content line-clamp-1"')
text2 = text2.replace('className="badge badge-outline text-xs whitespace-nowrap"', 'className="badge badge-outline border-base-200 text-neutral font-medium px-3 py-3 rounded-full whitespace-nowrap"')

text2 = text2.replace('className="flex flex-col gap-1.5 mt-1"', 'className="flex flex-col gap-2 mt-1"')

text2 = text2.replace('className="h-3.5 w-3.5 opacity-70 flex-shrink-0"', 'className="h-4 w-4 text-info flex-shrink-0"')
text2 = text2.replace('className="text-xs opacity-80 truncate"', 'className="text-sm text-neutral font-medium truncate"')

text2 = text2.replace('className="divider my-0"', 'className="divider my-1 opacity-50"')

text2 = text2.replace('className="flex justify-between text-xs opacity-70"', 'className="flex justify-between text-xs text-neutral font-medium"')
text2 = text2.replace('<span className="flex items-center gap-1">', '<span className="flex items-center gap-1.5">')

text2 = text2.replace('className={mt-auto pt-2 flex items-center justify-between gap-2 }', 'className={mt-auto pt-4 flex items-center justify-between gap-3 }')

text2 = text2.replace('className="btn btn-sm btn-error text-white"', 'className="btn bg-[#e84157] hover:bg-[#d63a4e] text-white border-none rounded-full min-h-10 h-10 px-5 shrink-0 transition-transform hover:scale-105"')
text2 = text2.replace('className="btn btn-sm btn-primary w-full"', 'className="btn btn-ghost bg-base-200 hover:bg-base-300 border-none rounded-full min-h-10 h-10 w-full flex items-center justify-center transition-colors"')

with codecs.open('kalima-platform/frontend/src/pages/Lecturer Dashboard/CourseGrid.jsx', 'w', 'utf8') as f:
    f.write(text2)

print("done!")

