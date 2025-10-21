const mongoose = require("mongoose");
const User = require("./userModel");


const moderatorSchema = new mongoose.Schema({

}, {
    timestamps: true,
}
);

const Moderator = User.discriminator("Moderator", moderatorSchema);

module.exports = Moderator;