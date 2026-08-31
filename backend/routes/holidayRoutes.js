const express = require('express');
const { listHolidays, getHoliday, createHoliday, updateHoliday, deleteHoliday } = require('../controllers/holidayController');
const { protect, restrictTo } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.route('/').get(listHolidays).post(restrictTo(ROLES.HR_ADMIN), createHoliday);
router.route('/:id').get(getHoliday).put(restrictTo(ROLES.HR_ADMIN), updateHoliday).delete(restrictTo(ROLES.HR_ADMIN), deleteHoliday);

module.exports = router;
