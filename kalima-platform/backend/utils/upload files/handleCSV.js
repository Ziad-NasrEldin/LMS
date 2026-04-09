const csv = require("csv-parser");
const processAndInsertUsers = require("./processFiles");

const handleCSV = async (fileBuffer, accountType, res, next) => {
  const results = [];
  const readableStream = require("stream").Readable.from(fileBuffer.toString());

  await new Promise((resolve, reject) => {
    readableStream
      .pipe(csv())
      .on("data", (data) => {
        // Extract fields and trim them
        const user = {
          name: data.name?.trim(),
          phoneNumber: data.phoneNumber?.trim(),
          parentPhoneNumber: data.parentPhoneNumber?.trim(),
          parentPhoneRelation: data.parentPhoneRelation?.trim(),
          stage: data.stage?.trim(),
          level: data.level?.trim(),
          gender: data.gender?.trim() || "not determined",
          password: data.password?.trim(),
          government: data.government?.trim(),
          administrationZone: data.administrationZone?.trim(),
          profession: data.profession?.trim(),
          subject: data.subject?.trim(),
        };

        // Minimum required check: name and phoneNumber are essential for most roles
        if (!user.name || !user.phoneNumber) return;

        // Generate email if not provided in CSV
        if (!data.email) {
          user.email = `${user.name.replace(/\s+/g, "").toLowerCase()}${user.phoneNumber.slice(-4)}@gmail.com`;
        } else {
          user.email = data.email.trim().toLowerCase();
        }

        user.role = accountType.charAt(0).toUpperCase() + accountType.slice(1);
        results.push(user);
      })
      .on("end", resolve)
      .on("error", reject);
  });

  await processAndInsertUsers(results, accountType, res, next);
};

module.exports = handleCSV;
