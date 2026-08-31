const express = require('express');
const {
  employeeDashboard,
  managerDashboard,
  adminDashboard,
} = require('../controllers/dashboardController');
const { protect, restrictTo } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/employee', restrictTo(ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.HR_ADMIN), employeeDashboard);
router.get('/manager', restrictTo(ROLES.MANAGER, ROLES.HR_ADMIN), managerDashboard);
router.get('/admin', restrictTo(ROLES.HR_ADMIN), adminDashboard);

module.exports = router;
