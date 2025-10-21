const express = require('express');
const parentController = require('../controllers/parentController');
const verifyJWT = require('../middleware/verifyJWT');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(verifyJWT, authController.verifyRoles('Admin', 'SubAdmin', 'Moderator', 'Assistant'));

router.post('/', parentController.createParent);

router.get('/', parentController.getAllParents);

router.get('/:id', parentController.getParentById);

router.patch('/:id', parentController.updateParent);

router.delete('/:id', parentController.deleteParent);

module.exports = router;
