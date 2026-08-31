const express = require('express');
const {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect, restrictTo } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/', listAnnouncements);
router.get('/:id', getAnnouncement);
router.post('/', restrictTo(ROLES.HR_ADMIN, ROLES.MANAGER), upload.single('attachment'), createAnnouncement);
router.put('/:id', restrictTo(ROLES.HR_ADMIN), upload.single('attachment'), updateAnnouncement);
router.delete('/:id', restrictTo(ROLES.HR_ADMIN), deleteAnnouncement);

module.exports = router;
