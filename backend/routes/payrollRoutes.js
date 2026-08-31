const express = require('express');
const {
  getMyStructure,
  getStructureForUser,
  saveStructure,
  updateStructure,
  deleteStructure,
  listAllStructures,
  generatePayroll,
  payrollSummary,
} = require('../controllers/payrollController');
const { protect, restrictTo } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/structure/me', getMyStructure);
router.get('/summary', restrictTo(ROLES.HR_ADMIN), payrollSummary);
router.get('/structures', restrictTo(ROLES.HR_ADMIN), listAllStructures);
router.get('/structure/:id', restrictTo(ROLES.HR_ADMIN, ROLES.MANAGER), getStructureForUser);

router.post('/generate', restrictTo(ROLES.HR_ADMIN), generatePayroll);
router.post('/structure/:id', restrictTo(ROLES.HR_ADMIN), saveStructure);
router.put('/structure/:id', restrictTo(ROLES.HR_ADMIN), updateStructure);
router.delete('/structure/:id', restrictTo(ROLES.HR_ADMIN), deleteStructure);

module.exports = router;
