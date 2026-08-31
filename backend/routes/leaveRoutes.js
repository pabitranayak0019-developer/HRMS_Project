const express = require('express');
const {
  applyLeave,
  myLeaves,
  myBalances,
  pendingApprovals,
  allLeaves,
  reviewLeave,
  cancelLeave,
} = require('../controllers/leaveController');
const { protect, restrictTo } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.post('/', applyLeave);
router.get('/me', myLeaves);
router.get('/balances', myBalances);
router.get('/approvals', restrictTo(ROLES.MANAGER, ROLES.HR_ADMIN), pendingApprovals);
router.get('/all', restrictTo(ROLES.MANAGER, ROLES.HR_ADMIN), allLeaves);
router.put('/:id/review', restrictTo(ROLES.MANAGER, ROLES.HR_ADMIN), reviewLeave);
router.post('/:id/cancel', cancelLeave);

module.exports = router;
