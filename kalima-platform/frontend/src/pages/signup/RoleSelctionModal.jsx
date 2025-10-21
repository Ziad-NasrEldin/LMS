"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronRight, GraduationCap, Users, BookOpen, X, BookA } from "lucide-react"
import {useNavigate} from "react-router-dom"
import { ImMan } from "react-icons/im"

// Role icons and colors mapping
const roleConfig = {
  student: {
    icon: GraduationCap,
    color: "bg-gradient-to-r from-primary/30 to-secondary/60",
    hoverColor: "hover:from-primary/60 hover:to-secondary/80",
  },
  parent: {
    icon: ImMan,
    color: "bg-gradient-to-r from-primary/30 to-secondary/60",
    hoverColor: "hover:from-primary/60 hover:to-secondary/80",
  },
  teacher: {
    icon: BookA,
    color: "bg-gradient-to-r from-primary/30 to-secondary/60",
    hoverColor: "hover:from-primary/60 hover:to-secondary/80",
  },
}

export default function RoleSelectionModal({ onSelectRole, t }) {
  const [hoveredRole, setHoveredRole] = useState(null)
  const navigate = useNavigate()
  // Animation variants
  const handleNavigateBack = () => {
    navigate(-1)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative w-[90%] max-w-md rounded-2xl bg-primary/20 shadow-2xl overflow-hidden"
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/10 rounded-full -ml-12 -mb-12"></div>
        <div className="btn btn-circle btn-sm absolute top-4 left-4">
          <X onClick={handleNavigateBack}/>
        </div>

        <div className="px-6 py-8">
          <motion.h3
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-bold text-primary-content text-center mb-2"
          >
            {t("roleSelection.title")}
          </motion.h3>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-4">
            {["student", "parent", "teacher"].map((role) => {
              const RoleIcon = roleConfig[role].icon

              return (
                <motion.button
                  key={role}
                  variants={itemVariants}
                  onHoverStart={() => setHoveredRole(role)}
                  onHoverEnd={() => setHoveredRole(null)}
                  onClick={() => onSelectRole(role)}
                  className={`relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300 
                    ${hoveredRole === role ? "scale-[1.02]" : "scale-100"}
                    ${roleConfig[role].color} ${roleConfig[role].hoverColor} text-white shadow-lg`}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm">
                    <RoleIcon className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1 ">
                    <h4 className="font-bold text-lg">{t(`role.${role}`)}</h4>
                  </div>

                  <motion.div
                    animate={{ x: hoveredRole === role ? 5 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.div>
                </motion.button>
              )
            })}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

