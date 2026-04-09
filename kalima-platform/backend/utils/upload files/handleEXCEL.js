const XLSX = require("xlsx");
const processAndInsertUsers = require("./processFiles");

const handleExcel = async (fileBuffer, accountType, res, next) => {
  const results = [];
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  jsonData.forEach((data) => {
    // Extract fields and trim them
    const user = {
      name: data.name?.toString().trim(),
      phoneNumber: data.phoneNumber?.toString().trim(),
      parentPhoneNumber: data.parentPhoneNumber?.toString().trim(),
      parentPhoneRelation: data.parentPhoneRelation?.toString().trim(),
      stage: data.stage?.toString().trim(),
      level: data.level?.toString().trim(),
      gender: data.gender?.toString().trim() || "not determined",
      password: data.password?.toString().trim(),
      government: data.government?.toString().trim(),
      administrationZone: data.administrationZone?.toString().trim(),
      profession: data.profession?.toString().trim(),
      subject: data.subject?.toString().trim(),
    };

    if (!user.name || !user.phoneNumber) return;

    if (!data.email) {
      user.email = `${user.name.replace(/\s+/g, "").toLowerCase()}${user.phoneNumber.slice(-4)}@gmail.com`;
    } else {
      user.email = data.email.toString().trim().toLowerCase();
    }

    user.role = accountType.charAt(0).toUpperCase() + accountType.slice(1);
    results.push(user);
  });

  await processAndInsertUsers(results, accountType, res, next);
};

module.exports = handleExcel;
