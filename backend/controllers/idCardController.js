const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { generateIdCardPDF } = require('../services/pdfService');
const { makeVerifyToken, toDataURL } = require('../services/qrService');

const myCard = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate('department').populate('employeeProfile');
  if (!user) return next(new AppError('User not found.', 404));
  const card = buildCard(user);
  res.json({ success: true, data: card });
});

const buildCard = (user) => {
  const profile = user.employeeProfile;
  const token = makeVerifyToken(
    user._id,
    user.employeeId || '',
    user.email,
    user.department ? user.department.name : '',
    profile ? profile.designation : ''
  );
  return {
    _id: user._id,
    fullName: user.fullName,
    employeeId: user.employeeId,
    email: user.email,
    designation: profile ? profile.designation : '',
    department: user.department ? user.department.name : '',
    photo: profile ? profile.photo : '',
    joiningDate: profile ? profile.joiningDate : null,
    validity: profile && profile.idCardValidity ? profile.idCardValidity : null,
    bloodGroup: profile ? profile.bloodGroup : '',
    token,
  };
};

const downloadPdf = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  let user;
  if (req.user && req.user.role !== 'HR_ADMIN' && String(req.user._id) !== String(id)) {
    return next(new AppError('You can only download your own ID card.', 403));
  }
  user = await User.findById(id).populate('department').populate('employeeProfile');
  if (!user) return next(new AppError('Employee not found.', 404));

  const buffer = await generateIdCardPDF(user, user.employeeProfile, user.department);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="employee_id_${user.employeeId || user._id}.pdf"`);
  res.send(buffer);
});

const cardQr = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate('department').populate('employeeProfile');
  if (!user) return next(new AppError('Employee not found.', 404));
  const card = buildCard(user);
  const qr = await toDataURL(card.token);
  res.json({ success: true, data: { ...card, qrDataUrl: qr } });
});

const verify = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id).populate('department').populate('employeeProfile');
  if (!user) {
    return res.status(404).json({ success: false, message: 'Invalid employee ID. Verification failed.', valid: false });
  }
  if (user.status !== 'ACTIVE') {
    return res.status(200).json({
      success: true,
      valid: false,
      message: 'Employee record exists but the account is not active.',
      data: { employeeId: user.employeeId, name: user.fullName, status: user.status },
    });
  }
  res.json({
    success: true,
    valid: true,
    message: 'Verified — Employee record is valid and active.',
    data: {
      employeeId: user.employeeId,
      name: user.fullName,
      department: user.department ? user.department.name : '',
      designation: user.employeeProfile ? user.employeeProfile.designation : '',
      joiningDate: user.employeeProfile ? user.employeeProfile.joiningDate : null,
      verifiedAt: new Date().toISOString(),
    },
  });
});

module.exports = { myCard, downloadPdf, cardQr, verify, buildCard };
