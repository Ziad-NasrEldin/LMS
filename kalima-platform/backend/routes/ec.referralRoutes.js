const express = require('express');
const router = express.Router();
const ecReferralController = require('../controllers/ec.referralController');
const authController = require('../controllers/authController');
const verifyJWT = require('../middleware/verifyJWT');


router.use(verifyJWT);
// GET /api/v1/ec/referrals/stats
router.get('/stats', authController.verifyRoles("Admin", "SubAdmin"),
    ecReferralController.getECReferralStats);

// POST /api/v1/ec/referrals/recalculate (admin only recommended)
router.post('/recalculate', authController.verifyRoles("Admin", "SubAdmin"),
    ecReferralController.recalculateAllSuccessfulInvites);

// GET /api/v1/ec/referrals/:userId/stats (admin/subadmin only)
router.get('/:userId/stats', authController.verifyRoles("Admin", "SubAdmin"), ecReferralController.getECReferralStatsByUser);

module.exports = router;
