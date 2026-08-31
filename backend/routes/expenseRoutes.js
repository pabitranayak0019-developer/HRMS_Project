const express = require('express');
const {
  submitExpense,
  myExpenses,
  listForApproval,
  allExpenses,
  reviewExpense,
} = require('../controllers/expenseController');
const { protect, restrictTo } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.post('/', upload.single('receipt'), submitExpense);
router.get('/me', myExpenses);
router.get('/approvals', restrictTo(ROLES.MANAGER, ROLES.HR_ADMIN), listForApproval);
router.get('/all', restrictTo(ROLES.MANAGER, ROLES.HR_ADMIN), allExpenses);
router.put('/:id/review', restrictTo(ROLES.MANAGER, ROLES.HR_ADMIN), reviewExpense);

module.exports = router;
