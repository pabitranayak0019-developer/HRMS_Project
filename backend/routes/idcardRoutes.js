const express = require('express');
const { myCard, downloadPdf, cardQr, verify } = require('../controllers/idCardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/verify/:id', verify);
router.get('/me', protect, myCard);
router.get('/:id/qr', protect, cardQr);
router.get('/:id/pdf', protect, downloadPdf);

module.exports = router;
