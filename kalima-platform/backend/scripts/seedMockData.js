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

const MOCK_LEVELS = [
  "first secondary",
  "second secondary",
  "third secondary",
];

const MOCK_SUBJECTS = [
  {
    name: "Physics",
    levels: ["first secondary", "second secondary", "third secondary"],
  },
  {
    name: "Mathematics",
    levels: ["first secondary", "second secondary", "third secondary"],
  },
  {
    name: "Arabic",
    levels: ["first secondary", "second secondary"],
  },
];

const MOCK_GOVERNMENTS = [
  {
    name: "Cairo",
    administrationZone: ["Nasr City", "Heliopolis", "Maadi"],
  },
  {
    name: "Giza",
    administrationZone: ["Dokki", "Mohandessin", "6th of October"],
  },
  {
    name: "Alexandria",
    administrationZone: ["Montaza", "Sidi Gaber", "Smouha"],
  },
  {
    name: "Dakahlia",
    administrationZone: ["Mansoura East", "Mansoura West", "Talkha"],
  },
];

async function upsertLevel(name) {
  const existing = await Level.findOne({ name });
  if (existing) return existing;
  return Level.create({ name });
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

async function upsertMockStudent({ levelId, defaultPasswordHash, governmentName, administrationZone }) {
  const studentEmail = "mock.student1@fekra-edu.com";

  const existing = await Student.findOne({ email: studentEmail });
  if (existing) return existing;

  return Student.create({
    name: "Omar Khaled",
    email: studentEmail,
    password: defaultPasswordHash,
    gender: "male",
    level: levelId,
    government: governmentName,
    administrationZone,
    phoneNumber: "01012345678",
    parentPhoneNumber: "01011112222",
    faction: "Science",
    hobbies: ["Reading", "Math puzzles"],
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
    for (const governmentInput of MOCK_GOVERNMENTS) {
      const government = await upsertGovernment(governmentInput);
      governments.push(government);
    }
    const zoneCount = await syncAdministrationZones(governments);
    console.log(`Governments ready: ${governments.length}`);
    console.log(`Administration zones ready: ${zoneCount}`);

    const levelByName = {};
    for (const levelName of MOCK_LEVELS) {
      levelByName[levelName] = await upsertLevel(levelName);
    }
    console.log(`Levels ready: ${Object.keys(levelByName).length}`);

    const subjectByName = {};
    for (const subjectInput of MOCK_SUBJECTS) {
      const levelIds = subjectInput.levels
        .map((levelName) => levelByName[levelName])
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

    const studentLevel = levelByName["first secondary"];
    const defaultGovernment = governments[0];
    const defaultZone = defaultGovernment.administrationZone[0];

    await upsertMockStudent({
      levelId: studentLevel._id,
      defaultPasswordHash: hashedPassword,
      governmentName: defaultGovernment.name,
      administrationZone: defaultZone,
    });
    console.log("Student mock account ready: 1");

    const courseA = await upsertCourseContainer({
      name: "Physics Basics Course",
      subjectId: subjectByName.Physics._id,
      levelId: levelByName["first secondary"]._id,
      lecturerId: lecturers[0]._id,
      description: "An introduction to physics concepts for first secondary students.",
    });

    const courseB = await upsertCourseContainer({
      name: "Arabic Grammar Course",
      subjectId: subjectByName.Arabic._id,
      levelId: levelByName["second secondary"]._id,
      lecturerId: lecturers[1]._id,
      description: "Core grammar and writing exercises for second secondary.",
    });

    const lectureA1 = await upsertLecture({
      name: "Introduction to Motion",
      subjectId: subjectByName.Physics._id,
      levelId: levelByName["first secondary"]._id,
      lecturerId: lecturers[0]._id,
      parentId: courseA._id,
      description: "Basic concepts of speed and motion.",
    });

    const lectureA2 = await upsertLecture({
      name: "Forces and Newton Laws",
      subjectId: subjectByName.Physics._id,
      levelId: levelByName["first secondary"]._id,
      lecturerId: lecturers[0]._id,
      parentId: courseA._id,
      description: "Newton laws with practical examples.",
    });

    const lectureB1 = await upsertLecture({
      name: "Sentence Structures",
      subjectId: subjectByName.Arabic._id,
      levelId: levelByName["second secondary"]._id,
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