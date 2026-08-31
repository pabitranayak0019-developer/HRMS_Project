const express = require('express');
const {
  listDocuments,
  uploadDocument,
  getDocument,
  downloadDocument,
  deleteDocument,
} = require('../controllers/documentController');
const { protect, restrictTo } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/', listDocuments);
router.post('/', restrictTo(ROLES.HR_ADMIN, ROLES.MANAGER), upload.single('file'), uploadDocument);
router.get('/:id', getDocument);
router.get('/:id/download', downloadDocument);
router.delete('/:id', restrictTo(ROLES.HR_ADMIN, ROLES.MANAGER), deleteDocument);

module.exports = router;
