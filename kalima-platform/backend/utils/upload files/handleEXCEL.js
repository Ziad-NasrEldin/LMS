const XLSX = require("xlsx");
const processAndInsertUsers = require("./processFiles");

const handleExcel = async (fileBuffer, accountType, res, next) => {
  const results = [];
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, {
    header: ["name", "phoneNumber"],
    range: 1,
  });

  jsonData.forEach((data) => {
    const name = data.name?.trim();
    const phoneNumber = data.phoneNumber?.toString().trim();
    if (!name || !phoneNumber) return;
    results.push({
      name,
      phoneNumber,
      email: `${name.replace(/\s+/g, "")}${phoneNumber.slice(-4)}@gmail.com`,
      gender: "not determined",
      password: phoneNumber,
      role: accountType.charAt(0).toUpperCase() + accountType.slice(1),
    });
  });

  await processAndInsertUsers(results, accountType, res, next);
};

module.exports = handleExcel;
