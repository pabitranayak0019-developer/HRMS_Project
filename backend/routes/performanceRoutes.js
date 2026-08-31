const express = require('express');
const { createReview, updateReview, myReviews, listReviews, getReview } = require('../controllers/performanceController');
const { protect, restrictTo } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/me', myReviews);
router.get('/', restrictTo(ROLES.MANAGER, ROLES.HR_ADMIN), listReviews);
router.post('/', restrictTo(ROLES.MANAGER, ROLES.HR_ADMIN), createReview);
router.get('/:id', getReview);
router.put('/:id', restrictTo(ROLES.MANAGER, ROLES.HR_ADMIN), updateReview);

module.exports = router;
