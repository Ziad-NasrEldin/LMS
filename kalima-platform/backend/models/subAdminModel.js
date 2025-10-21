const mongoose = require("mongoose");
const User = require("./userModel");


const subAdminSchema = new mongoose.Schema(
    {

    },
    {
        timestamps: true,
    }
);

const SubAdmin = User.discriminator("SubAdmin", subAdminSchema);

module.exports = SubAdmin;