const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const authController = require('../controllers/authController');
const commentController = require('../controllers/commentController');

const router = express.Router();

// All comment routes require authentication
router.use(verifyJWT);

router.route('/')
    .post(commentController.createComment);

router.route('/lecture/:lectureId')
    .get(commentController.getLectureComments);

router.route('/comment/:commentId/replies')
    .get(commentController.getCommentReplies);

router.route('/:id')
    .patch(commentController.updateComment)
    .delete(commentController.deleteComment);

router.route('/:id/like')
    .post(commentController.toggleLike);

module.exports = router;
