const express = require('express');
const {
  createEmployee,
  listEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  updateStatus,
  getMyProfile,
  updateMyProfile,
  uploadPhoto,
  uploadEmployeePhoto,
  getManagers,
} = require('../controllers/employeeController');
const { protect, restrictTo } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/managers', getManagers);
router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);
router.post('/me/photo', upload.single('photo'), uploadPhoto);

router.route('/').get(restrictTo(ROLES.HR_ADMIN, ROLES.MANAGER), listEmployees).post(restrictTo(ROLES.HR_ADMIN), createEmployee);

router
  .route('/:id')
  .get(restrictTo(ROLES.HR_ADMIN, ROLES.MANAGER), getEmployee)
  .put(restrictTo(ROLES.HR_ADMIN), updateEmployee)
  .delete(restrictTo(ROLES.HR_ADMIN), deleteEmployee);

router.patch('/:id/status', restrictTo(ROLES.HR_ADMIN), updateStatus);
router.post('/:id/photo', restrictTo(ROLES.HR_ADMIN), upload.single('photo'), uploadEmployeePhoto);

module.exports = router;
