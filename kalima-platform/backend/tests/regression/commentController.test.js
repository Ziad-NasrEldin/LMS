const test = require("node:test");
const assert = require("node:assert/strict");

const commentController = require("../../controllers/commentController");
const Comment = require("../../models/CommentModel");
const Lecture = require("../../models/LectureModel");

const originalCommentFind = Comment.find;
const originalCommentFindById = Comment.findById;
const originalCommentCreate = Comment.create;
const originalCommentDeleteMany = Comment.deleteMany;
const originalLectureFindById = Lecture.findById;

const restoreMethods = () => {
  Comment.find = originalCommentFind;
  Comment.findById = originalCommentFindById;
  Comment.create = originalCommentCreate;
  Comment.deleteMany = originalCommentDeleteMany;
  Lecture.findById = originalLectureFindById;
};

const runController = (handler, req) =>
  new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ statusCode: this.statusCode, payload });
        return this;
      },
    };

    handler(req, res, (error) => {
      if (error) {
        reject(error);
      }
    });
  });

test("createComment rejects replies that target a different lecture", async () => {
  Lecture.findById = async (id) => ({ _id: id, parent: null });
  Comment.findById = () => ({
    select: async () => ({
      _id: "comment-1",
      lectureId: {
        toString() {
          return "lecture-other";
        },
      },
    }),
  });

  try {
    await assert.rejects(
      runController(commentController.createComment, {
        body: {
          lectureId: "lecture-1",
          content: "reply",
          parentId: "comment-1",
        },
        user: {
          _id: "lecturer-1",
          role: "Lecturer",
        },
      }),
      (error) => {
        assert.equal(error.statusCode, 400);
        assert.equal(error.message, "Reply must belong to the same lecture");
        return true;
      }
    );
  } finally {
    restoreMethods();
  }
});

test("deleteComment removes nested descendants recursively", async () => {
  const deleteFilters = [];

  Comment.findById = async () => ({
    _id: "root-comment",
    userId: {
      toString() {
        return "author-1";
      },
    },
  });

  Comment.find = ({ parentId }) => ({
    select: async () => {
      if (parentId === "root-comment") {
        return [{ _id: "child-1" }, { _id: "child-2" }];
      }
      if (parentId === "child-1") {
        return [{ _id: "grandchild-1" }];
      }
      return [];
    },
  });

  Comment.deleteMany = async (filter) => {
    deleteFilters.push(filter);
    return { acknowledged: true };
  };

  try {
    const result = await runController(commentController.deleteComment, {
      params: { id: "root-comment" },
      user: {
        _id: "author-1",
        role: "Student",
      },
    });

    assert.equal(result.statusCode, 200);
    assert.deepEqual(deleteFilters, [
      {
        _id: {
          $in: ["root-comment", "child-1", "child-2", "grandchild-1"],
        },
      },
    ]);
  } finally {
    restoreMethods();
  }
});
