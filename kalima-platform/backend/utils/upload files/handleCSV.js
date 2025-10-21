const csv = require("csv-parser");
const processAndInsertUsers = require("./processFiles");

const handleCSV = async (fileBuffer, accountType, res, next) => {
  const results = [];
  const readableStream = require("stream").Readable.from(fileBuffer.toString());

  await new Promise((resolve, reject) => {
    readableStream
      .pipe(csv())
      .on("data", (data) => {
        const name = data.name?.trim();
        const phoneNumber = data.phoneNumber?.trim();
        if (!name || !phoneNumber) return;
        results.push({
          name,
          phoneNumber,
          email: `${name.replace(/\s+/g, "")}${phoneNumber.slice(
            -4
          )}@gmail.com`,
          gender: "not determined",
          password: phoneNumber,
          role: accountType.charAt(0).toUpperCase() + accountType.slice(1),
        });
      })
      .on("end", resolve)
      .on("error", reject);
  });

  await processAndInsertUsers(results, accountType, res, next);
};

module.exports = handleCSV;
