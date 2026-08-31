const express = require('express');
const {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { protect, restrictTo } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.route('/').get(listDepartments).post(restrictTo(ROLES.HR_ADMIN), createDepartment);

router
  .route('/:id')
  .get(getDepartment)
  .put(restrictTo(ROLES.HR_ADMIN), updateDepartment)
  .delete(restrictTo(ROLES.HR_ADMIN), deleteDepartment);

module.exports = router;
