const mongoose = require("mongoose")

const lectureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A lecture must have a name"],
      trim: true,
    },
    type: {
      type: String,
      default: "lecture",
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "Price cannot be negative"],
    },
    level: {
      type: mongoose.Schema.ObjectId,
      ref: "Level",
      required: [true, "A lecture must belong to a level"],
    },
    subject: {
      type: mongoose.Schema.ObjectId,
      ref: "Subject",
      required: [true, "A lecture must belong to a subject"],
    },
    parent: {
      type: mongoose.Schema.ObjectId,
      ref: "Container",
    },
    teacherAllowed: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "Lecturer",
      required: [true, "A lecture must have a creator"],
    },
    videoLink: {
      type: String,
      trim: true,
    },
    examLink: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    numberOfViews: {
      type: Number,
      default: 0,
      min: [0, "Number of views cannot be negative"],
    },
    lecture_type: {
      type: String,
      required: [true, "A lecture must have a type"],
      enum: {
        values: ["Free", "Paid", "Revision", "Teachers Only"],
        message: "Lecture type must be either Free, Paid, Revision, or Teachers Only",
      },
    },
    thumbnail: {
      type: String,
    },
    requiresExam: {
      type: Boolean,
      default: false,
    },
    examConfig: {
      type: mongoose.Schema.ObjectId,
      ref: "LecturerExamConfig",
    },
    passingThreshold: {
      type: Number,
      min: [0, "Passing threshold cannot be negative"],
      max: [100, "Passing threshold cannot exceed 100"],
    },
    requiresHomework: {
      type: Boolean,
      default: false,
    },
    homeworkConfig: {
      type: mongoose.Schema.ObjectId,
      ref: "HomeworkConfig",
    },
    homeworkPassingThreshold: {
      type: Number,
      min: [0, "Homework passing threshold cannot be negative"],
      max: [100, "Homework passing threshold cannot exceed 100"],
    },
    attachments: {
      booklets: [
        {
          type: mongoose.Schema.ObjectId,
          ref: "Attachment",
        },
      ],
      pdfsandimages: [
        {
          type: mongoose.Schema.ObjectId,
          ref: "Attachment",
        },
      ],
      homeworks: [
        {
          type: mongoose.Schema.ObjectId,
          ref: "Attachment",
        },
      ],
      exams: [
        {
          type: mongoose.Schema.ObjectId,
          ref: "Attachment",
        },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

lectureSchema.pre("save", function (next) {
  // Ensure boolean fields are properly converted
  if (this.requiresExam !== undefined) {
    if (typeof this.requiresExam === "string") {
      this.requiresExam = this.requiresExam.toLowerCase() === "true"
    } else {
      this.requiresExam = Boolean(this.requiresExam)
    }
  }
  if (this.requiresHomework !== undefined) {
    if (typeof this.requiresHomework === "string") {
      this.requiresHomework = this.requiresHomework.toLowerCase() === "true"
    } else {
      this.requiresHomework = Boolean(this.requiresHomework)
    }
  }
  if (this.teacherAllowed !== undefined) {
    if (typeof this.teacherAllowed === "string") {
      this.teacherAllowed = this.teacherAllowed.toLowerCase() === "true"
    } else {
      this.teacherAllowed = Boolean(this.teacherAllowed)
    }
  }
  next()
})

lectureSchema.pre("save", function (next) {
  if (this.requiresExam && !this.examConfig) {
    return next(new Error("Exam configuration is required when requiresExam is true"))
  }
  if (this.requiresHomework && !this.homeworkConfig) {
    return next(new Error("Homework configuration is required when requiresHomework is true"))
  }
  next()
})

const Lecture = mongoose.model("Lecture", lectureSchema)

module.exports = Lecture
