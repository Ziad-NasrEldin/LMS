const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    lectureId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Lecture',
        required: [true, 'Comment must belong to a lecture'],
        index: true
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Comment must belong to a user'],
    },
    content: {
        type: String,
        required: [true, 'Comment content cannot be empty'],
        trim: true
    },
    parentId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Comment',
        default: null,
        index: true,
    },
    likes: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);
