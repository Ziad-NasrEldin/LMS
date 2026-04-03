const Attachment = require("../models/attachmentModel");
const Code = require("../models/codeModel");
const Container = require("../models/containerModel");
const Lecture = require("../models/LectureModel");
const LecturerExamConfig = require("../models/ExamConfigModel");
const Parent = require("../models/parentModel");
const Purchase = require("../models/purchaseModel");
const Student = require("../models/studentModel");
const StudentExamSubmission = require("../models/studentExamSubmissionModel");
const StudentLectureAccess = require("../models/studentLectureAccessModel");
const Teacher = require("../models/teacherModel");

const withSession = (query, session) => (session ? query.session(session) : query);

const cleanupLecturerContent = async (lecturerId, options = {}) => {
  const { session } = options;

  const [containerDocs, lectureDocs] = await Promise.all([
    withSession(
      Container.find({ createdBy: lecturerId }).select("_id").lean(),
      session
    ),
    withSession(
      Lecture.find({ createdBy: lecturerId }).select("_id").lean(),
      session
    ),
  ]);

  const containerIds = containerDocs.map((doc) => doc._id);
  const lectureIds = lectureDocs.map((doc) => doc._id);
  const contentIdsToPrune = [...containerIds, ...lectureIds];

  if (contentIdsToPrune.length > 0) {
    await withSession(
      Container.updateMany(
        { children: { $in: contentIdsToPrune } },
        { $pull: { children: { $in: contentIdsToPrune } } }
      ),
      session
    );
  }

  if (containerIds.length > 0) {
    await withSession(
      Container.updateMany(
        {
          parent: { $in: containerIds },
          _id: { $nin: containerIds },
        },
        { $set: { parent: null } }
      ),
      session
    );
  }

  await Promise.all([
    withSession(
      Purchase.deleteMany({
        $or: [
          { lecturer: lecturerId },
          ...(containerIds.length > 0 ? [{ container: { $in: containerIds } }] : []),
          ...(lectureIds.length > 0 ? [{ lecture: { $in: lectureIds } }] : []),
        ],
      }),
      session
    ),
    withSession(Code.deleteMany({ lecturerId }), session),
    withSession(LecturerExamConfig.deleteMany({ lecturer: lecturerId }), session),
    withSession(
      Student.updateMany(
        { "lecturerPoints.lecturer": lecturerId },
        { $pull: { lecturerPoints: { lecturer: lecturerId } } }
      ),
      session
    ),
    withSession(
      Parent.updateMany(
        { "lecturerPoints.lecturer": lecturerId },
        { $pull: { lecturerPoints: { lecturer: lecturerId } } }
      ),
      session
    ),
    withSession(
      Teacher.updateMany(
        { "lecturerPoints.lecturer": lecturerId },
        { $pull: { lecturerPoints: { lecturer: lecturerId } } }
      ),
      session
    ),
  ]);

  if (lectureIds.length > 0) {
    await Promise.all([
      withSession(Attachment.deleteMany({ lectureId: { $in: lectureIds } }), session),
      withSession(
        StudentLectureAccess.deleteMany({ lecture: { $in: lectureIds } }),
        session
      ),
      withSession(
        StudentExamSubmission.deleteMany({ lecture: { $in: lectureIds } }),
        session
      ),
    ]);
  }

  await Promise.all([
    withSession(Container.deleteMany({ _id: { $in: containerIds } }), session),
    withSession(Lecture.deleteMany({ _id: { $in: lectureIds } }), session),
  ]);
};

module.exports = cleanupLecturerContent;
