const express = require('express');
const {
  clockIn,
  clockOut,
  todayStatus,
  myMonth,
  teamMonth,
  records,
} = require('../controllers/attendanceController');
const { protect, restrictTo } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/today', todayStatus);
router.get('/me/month', myMonth);
router.get('/team/month', restrictTo(ROLES.MANAGER, ROLES.HR_ADMIN), teamMonth);
router.get('/records', records);

module.exports = router;
