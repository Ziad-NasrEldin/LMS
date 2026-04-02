require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Level = require("../models/levelModel");
const Subject = require("../models/subjectModel");
const Lecturer = require("../models/lecturerModel");
const Student = require("../models/studentModel");
const Government = require("../models/governmentModel");
const AdministrationZone = require("../models/administrationZonesModel");
const Container = require("../models/containerModel");
const Lecture = require("../models/LectureModel");
const { governmentsData } = require("../utils/seeds/seedGovernments");

const STAGE_META = {
  primary: { order: 1, en: "primary", ar: "الابتدائي" },
  preparatory: { order: 2, en: "preparatory", ar: "الإعدادي" },
  secondary: { order: 3, en: "secondary", ar: "الثانوي" },
};

const ORDINAL_META = [
  { order: 1, en: "first", ar: "الأول" },
  { order: 2, en: "second", ar: "الثاني" },
  { order: 3, en: "third", ar: "الثالث" },
  { order: 4, en: "fourth", ar: "الرابع" },
  { order: 5, en: "fifth", ar: "الخامس" },
  { order: 6, en: "sixth", ar: "السادس" },
];

const MOCK_LECTURERS = [
  {
    name: "Ahmed Hassan",
    email: "mock.lecturer1@fekra-edu.com",
    gender: "male",
    bio: "Physics and mathematics teacher with practical exam-focused lessons.",
    expertise: "Physics",
  },
  {
    name: "Sara Ali",
    email: "mock.lecturer2@fekra-edu.com",
    gender: "female",
    bio: "Arabic language teacher focused on grammar and writing skills.",
    expertise: "Arabic",
  },
];

const STAGE_DEFINITIONS = Object.keys(STAGE_META).map((key, index) => ({
  key,
  name: STAGE_META[key].en,
  nameAr: STAGE_META[key].ar,
  kind: "stage",
  sortOrder: index + 1,
}));

const GRADE_DEFINITIONS = Object.keys(STAGE_META).flatMap((stageKey) =>
  ORDINAL_META.map((ordinal) => ({
    key: `${stageKey}:${ordinal.order}`,
    stageKey,
    order: ordinal.order,
    name: `${ordinal.en} ${STAGE_META[stageKey].en}`,
    nameAr: `الصف ${ordinal.ar} ${STAGE_META[stageKey].ar}`,
    kind: "grade",
    sortOrder: ordinal.order,
  }))
);

const MOCK_SUBJECTS = [
  {
    name: "Physics",
    levels: ["secondary:1", "secondary:2", "secondary:3"],
  },
  {
    name: "Mathematics",
    levels: ["secondary:1", "secondary:2", "secondary:3"],
  },
  {
    name: "Arabic",
    levels: ["secondary:1", "secondary:2"],
  },
];

async function upsertLevel(definition, parentLevelId = null) {
  const existing = await Level.findOne({
    $or: [{ name: definition.name }, { nameAr: definition.nameAr }],
  });

  if (existing) {
    existing.kind = definition.kind;
    existing.sortOrder = definition.sortOrder;
    existing.parentLevel = parentLevelId || null;
    if (existing.isActive === undefined) {
      existing.isActive = true;
    }
    await existing.save();
    return existing;
  }

  return Level.create({
    name: definition.name,
    nameAr: definition.nameAr,
    kind: definition.kind,
    parentLevel: parentLevelId || null,
    sortOrder: definition.sortOrder,
    isActive: true,
  });
}

async function upsertLecturer(lecturerInput, defaultPasswordHash) {
  const existing = await Lecturer.findOne({ email: lecturerInput.email });
  if (existing) return existing;

  return Lecturer.create({
    name: lecturerInput.name,
    email: lecturerInput.email,
    password: defaultPasswordHash,
    gender: lecturerInput.gender,
    bio: lecturerInput.bio,
    expertise: lecturerInput.expertise,
    isEmailVerified: true,
  });
}

async function upsertSubject(name, levelIds) {
  const existing = await Subject.findOne({ name });
  if (!existing) {
    return Subject.create({ name, level: levelIds });
  }

  const mergedLevels = Array.from(
    new Set([...(existing.level || []).map(String), ...levelIds.map(String)])
  );

  existing.level = mergedLevels;
  await existing.save();
  return existing;
}

async function upsertGovernment(governmentInput) {
  const existing = await Government.findOne({ name: governmentInput.name });
  if (!existing) {
    return Government.create(governmentInput);
  }

  const mergedZones = Array.from(
    new Set([
      ...(existing.administrationZone || []).map((zone) => zone.trim()),
      ...governmentInput.administrationZone.map((zone) => zone.trim()),
    ])
  );

  existing.administrationZone = mergedZones;
  await existing.save();
  return existing;
}

async function syncAdministrationZones(governments) {
  const uniqueZones = Array.from(
    new Set(
      governments.flatMap((gov) =>
        (gov.administrationZone || []).map((zone) => zone.trim())
      )
    )
  );

  for (const zoneName of uniqueZones) {
    const exists = await AdministrationZone.findOne({ name: zoneName });
    if (!exists) {
      await AdministrationZone.create({ name: zoneName });
    }
  }

  return uniqueZones.length;
}

async function upsertMockStudent({
  stageId,
  levelId,
  defaultPasswordHash,
  governmentName,
  administrationZone,
}) {
  const studentEmail = "mock.student1@fekra-edu.com";

  const existing = await Student.findOne({ email: studentEmail });
  if (existing) return existing;

  return Student.create({
    name: "Omar Khaled",
    email: studentEmail,
    password: defaultPasswordHash,
    gender: "male",
    stage: stageId,
    level: levelId,
    government: governmentName,
    administrationZone,
    phoneNumber: "01012345678",
    parentPhoneNumber: "01011112222",
    faction: "Science",
    isEmailVerified: true,
  });
}

async function upsertCourseContainer({ name, subjectId, levelId, lecturerId, description }) {
  const existing = await Container.findOne({
    name,
    type: "course",
    createdBy: lecturerId,
  });

  if (existing) return existing;

  return Container.create({
    name,
    type: "course",
    subject: subjectId,
    level: levelId,
    createdBy: lecturerId,
    teacherAllowed: true,
    price: 0,
    description,
    goal: ["Understand core concepts", "Practice with examples"],
  });
}

async function upsertLecture({ name, subjectId, levelId, lecturerId, parentId, description }) {
  const existing = await Lecture.findOne({
    name,
    createdBy: lecturerId,
    subject: subjectId,
    level: levelId,
  });

  if (existing) return existing;

  return Lecture.create({
    name,
    subject: subjectId,
    level: levelId,
    createdBy: lecturerId,
    parent: parentId,
    lecture_type: "Free",
    teacherAllowed: true,
    price: 0,
    description,
  });
}

async function runSeedMockData() {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    console.log("Connected to MongoDB");

    const defaultPassword = process.env.MOCK_PASSWORD || "Password123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    const governments = [];
    for (const governmentInput of governmentsData) {
      const government = await upsertGovernment(governmentInput);
      governments.push(government);
    }
    const zoneCount = await syncAdministrationZones(governments);
    console.log(`Governments ready: ${governments.length}`);
    console.log(`Administration zones ready: ${zoneCount}`);

    const levelByKey = {};
    for (const stageDefinition of STAGE_DEFINITIONS) {
      const stageLevel = await upsertLevel(stageDefinition);
      levelByKey[stageDefinition.key] = stageLevel;
    }

    for (const gradeDefinition of GRADE_DEFINITIONS) {
      const stageLevel = levelByKey[gradeDefinition.stageKey];
      const gradeLevel = await upsertLevel(gradeDefinition, stageLevel._id);
      levelByKey[gradeDefinition.key] = gradeLevel;
    }
    console.log(`Levels ready: ${Object.keys(levelByKey).length}`);

    const subjectByName = {};
    for (const subjectInput of MOCK_SUBJECTS) {
      const levelIds = subjectInput.levels
        .map((levelKey) => levelByKey[levelKey])
        .filter(Boolean)
        .map((levelDoc) => levelDoc._id);
      subjectByName[subjectInput.name] = await upsertSubject(subjectInput.name, levelIds);
    }
    console.log(`Subjects ready: ${Object.keys(subjectByName).length}`);

    const lecturers = [];
    for (const lecturerInput of MOCK_LECTURERS) {
      const lecturer = await upsertLecturer(lecturerInput, hashedPassword);
      lecturers.push(lecturer);
    }
    console.log(`Lecturers ready: ${lecturers.length}`);

    const studentStage = levelByKey["secondary"];
    const studentLevel = levelByKey["secondary:1"];
    const defaultGovernment = governments[0];
    const defaultZone = defaultGovernment.administrationZone[0];

    await upsertMockStudent({
      stageId: studentStage._id,
      levelId: studentLevel._id,
      defaultPasswordHash: hashedPassword,
      governmentName: defaultGovernment.name,
      administrationZone: defaultZone,
    });
    console.log("Student mock account ready: 1");

    const courseA = await upsertCourseContainer({
      name: "Physics Basics Course",
      subjectId: subjectByName.Physics._id,
      levelId: levelByKey["secondary:1"]._id,
      lecturerId: lecturers[0]._id,
      description: "An introduction to physics concepts for first secondary students.",
    });

    const courseB = await upsertCourseContainer({
      name: "Arabic Grammar Course",
      subjectId: subjectByName.Arabic._id,
      levelId: levelByKey["secondary:2"]._id,
      lecturerId: lecturers[1]._id,
      description: "Core grammar and writing exercises for second secondary.",
    });

    const lectureA1 = await upsertLecture({
      name: "Introduction to Motion",
      subjectId: subjectByName.Physics._id,
      levelId: levelByKey["secondary:1"]._id,
      lecturerId: lecturers[0]._id,
      parentId: courseA._id,
      description: "Basic concepts of speed and motion.",
    });

    const lectureA2 = await upsertLecture({
      name: "Forces and Newton Laws",
      subjectId: subjectByName.Physics._id,
      levelId: levelByKey["secondary:1"]._id,
      lecturerId: lecturers[0]._id,
      parentId: courseA._id,
      description: "Newton laws with practical examples.",
    });

    const lectureB1 = await upsertLecture({
      name: "Sentence Structures",
      subjectId: subjectByName.Arabic._id,
      levelId: levelByKey["secondary:2"]._id,
      lecturerId: lecturers[1]._id,
      parentId: courseB._id,
      description: "How to build clear and correct Arabic sentences.",
    });

    const childIdsByCourse = {
      [courseA._id.toString()]: [lectureA1._id, lectureA2._id],
      [courseB._id.toString()]: [lectureB1._id],
    };

    for (const [courseId, childIds] of Object.entries(childIdsByCourse)) {
      await Container.findByIdAndUpdate(courseId, {
        $addToSet: { children: { $each: childIds } },
      });
    }

    console.log("Mock seed completed successfully.");
    console.log("Mock lecturer credentials:");
    console.log("- mock.lecturer1@fekra-edu.com / " + defaultPassword);
    console.log("- mock.lecturer2@fekra-edu.com / " + defaultPassword);
    console.log("Mock student credentials:");
    console.log("- mock.student1@fekra-edu.com / " + defaultPassword);
  } catch (error) {
    console.error("Mock seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

runSeedMockData();
