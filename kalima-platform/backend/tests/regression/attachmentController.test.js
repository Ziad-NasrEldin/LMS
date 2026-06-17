const test = require("node:test");
const assert = require("node:assert/strict");
const { PassThrough } = require("node:stream");

const attachmentController = require("../../controllers/attachmentController");
const Attachment = require("../../models/attachmentModel");
const axios = require("axios");

const originalAttachmentFindById = Attachment.findById;
const originalAxiosGet = axios.get;

const restoreMethods = () => {
  Attachment.findById = originalAttachmentFindById;
  axios.get = originalAxiosGet;
};

test("getAttachmentFile sends the stored original filename for lecture downloads", async () => {
  try {
    const originalFileName = "Final Review 2026 - نسخة الطالب.pdf";
    Attachment.findById = async () => ({
      fileType: "application/pdf",
      fileName: originalFileName,
      filePath: "https://cdn.example.com/fekra/generated-id.pdf",
    });

    axios.get = async () => {
      const stream = new PassThrough();
      process.nextTick(() => {
        stream.end(Buffer.from("pdf"));
      });
      return { data: stream };
    };

    const headers = {};
    const req = { params: { attachmentId: "507f1f77bcf86cd799439011" } };
    const res = new PassThrough();
    res.setHeader = (name, value) => {
      headers[name.toLowerCase()] = value;
    };

    await new Promise((resolve, reject) => {
      res.on("finish", resolve);
      attachmentController.getAttachmentFile(req, res, reject);
    });

    assert.equal(headers["content-type"], "application/pdf");
    assert.match(headers["content-disposition"], /attachment; filename=/);
    assert.match(headers["content-disposition"], /filename\*=UTF-8''Final%20Review%202026%20-%20%D9%86%D8%B3%D8%AE%D8%A9%20%D8%A7%D9%84%D8%B7%D8%A7%D9%84%D8%A8\.pdf/);
    assert.equal(decodeURIComponent(headers["x-download-filename"]), originalFileName);
  } finally {
    restoreMethods();
  }
});

test("download filename helper strips path components without changing the base name", () => {
  assert.equal(
    attachmentController._test.normalizeDownloadFilename("folder/Exact Name (v1).docx"),
    "Exact Name (v1).docx"
  );
});
