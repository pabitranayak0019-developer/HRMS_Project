const express = require('express');
const { myPayslips, getPayslip, listAll, downloadPdf } = require('../controllers/payslipController');
const { protect, restrictTo } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/me', myPayslips);
router.get('/all', restrictTo(ROLES.HR_ADMIN, ROLES.MANAGER), listAll);
router.get('/:id/download', downloadPdf);
router.get('/:id', getPayslip);

module.exports = router;
