const User = require('../models/User');
const EmployeeProfile = require('../models/EmployeeProfile');
const Department = require('../models/Department');
const SalaryStructure = require('../models/SalaryStructure');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { serializeUser } = require('../utils/serializer');
const { createNotification, notifyAdmins } = require('../services/notificationService');
const { ROLES } = require('../config/constants');

const nextEmployeeId = async () => {
  const last = await User.findOne({ employeeId: /^EMP-/ }).sort({ employeeId: -1 }).select('employeeId');
  let num = 1001;
  if (last) {
    const m = String(last.employeeId).match(/(\d+)$/);
    if (m) num = Number(m[1]) + 1;
  }
  let id = `EMP-${num}`;
  while (await User.exists({ employeeId: id })) {
    num += 1;
    id = `EMP-${num}`;
  }
  return id;
};

const DEFAULT_PASSWORD = 'Welcome@123';

const createEmployee = asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    role,
    department,
    manager,
    designation,
    joiningDate,
    gender,
    dob,
    phone,
    bloodGroup,
    employmentType,
    employmentStatus,
    basicSalary,
    salary,
    password,
  } = req.body;

  if (!firstName || !lastName || !email) return next(new AppError('First name, last name and email are required.', 400));

  const empRole = role === ROLES.MANAGER || role === ROLES.HR_ADMIN ? role : ROLES.EMPLOYEE;

  const user = await User.create({
    firstName,
    lastName,
    email,
    role: empRole,
    department,
    manager,
    employeeId: await nextEmployeeId(),
    password: password || DEFAULT_PASSWORD,
  });

  const profile = await EmployeeProfile.create({
    user: user._id,
    designation,
    joiningDate: joiningDate || Date.now(),
    gender,
    dob,
    phone,
    bloodGroup,
    employmentType,
    employmentStatus: employmentStatus || 'ACTIVE',
    idCardValidity: new Date(new Date(joiningDate || Date.now()).setFullYear(new Date(joiningDate || Date.now()).getFullYear() + 2)),
  });

  user.employeeProfile = profile._id;
  await user.save({ validateBeforeSave: false });

  if (salary && salary.basicSalary) {
    await SalaryStructure.create({
      user: user._id,
      effectiveFrom: joiningDate || Date.now(),
      ...salary,
    });
  }

  await createNotification({
    recipient: user._id,
    type: 'SYSTEM',
    title: 'Welcome to the portal',
    message: `Your account was created. Your Employee ID is ${user.employeeId}. Please login and update your profile.`,
    link: '/profile',
  });
  await notifyAdmins({
    type: 'SYSTEM',
    title: 'New employee added',
    message: `${firstName} ${lastName} (${user.employeeId}) was added to the portal.`,
  });

  const full = await User.findById(user._id).populate('department').populate('manager').populate('employeeProfile');
  res.status(201).json({ success: true, message: 'Employee created successfully.', user: serializeUser(full) });
});

const listEmployees = asyncHandler(async (req, res) => {
  const { search, department, status, role, designation, manager, page = 1, limit = 10, sort } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
    ];
  }
  if (department) query.department = department;
  if (status) query.status = status;
  if (role) query.role = role;
  if (designation) query['employeeProfile'] = { $exists: true };
  if (manager) query.manager = manager;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));

  let users = await User.find(query)
    .populate('department')
    .populate('manager', 'firstName lastName email employeeId')
    .populate('employeeProfile')
    .sort(sort || { createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: users.map((u) => ({
      ...serializeUser(u),
      profile: u.employeeProfile
        ? {
            designation: u.employeeProfile.designation,
            phone: u.employeeProfile.phone,
            joiningDate: u.employeeProfile.joiningDate,
            employmentStatus: u.employeeProfile.employmentStatus,
            photo: u.employeeProfile.photo,
          }
        : null,
    })),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const getEmployee = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .populate('department')
    .populate('manager', 'firstName lastName email employeeId')
    .populate('employeeProfile');
  if (!user) return next(new AppError('Employee not found.', 404));

  const salary = await SalaryStructure.findOne({ user: user._id, isActive: true }).sort({ effectiveFrom: -1 });

  res.json({
    success: true,
    data: {
      ...serializeUser(user),
      profile: user.employeeProfile,
      salaryStructure: salary,
    },
  });
});

const updateEmployee = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id).populate('employeeProfile');
  if (!user) return next(new AppError('Employee not found.', 404));

  const {
    firstName,
    lastName,
    email,
    role,
    department,
    manager,
    status,
    designation,
    gender,
    dob,
    phone,
    address,
    city,
    state,
    country,
    pincode,
    bloodGroup,
    joiningDate,
    employmentStatus,
    employmentType,
    bank,
    emergencyContact,
    skills,
  } = req.body;

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (email && email.toLowerCase() !== user.email) {
    const dup = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
    if (dup) return next(new AppError('Email already in use.', 409));
    user.email = email.toLowerCase();
  }
  if (role) user.role = role;
  if (department) user.department = department;
  if (manager) user.manager = manager;
  if (status) user.status = status;
  await user.save({ validateBeforeSave: false });

  let profile = user.employeeProfile;
  if (!profile) {
    profile = await EmployeeProfile.create({ user: user._id });
    user.employeeProfile = profile._id;
    await user.save({ validateBeforeSave: false });
  }

  const fields = { designation, gender, dob, phone, address, city, state, country, pincode, bloodGroup, joiningDate, employmentStatus, employmentType, skills };
  Object.keys(fields).forEach((k) => {
    if (fields[k] !== undefined) profile[k] = fields[k];
  });
  if (bank) {
    profile.bank = { ...(profile.bank || {}), ...bank };
  }
  if (emergencyContact) {
    profile.emergencyContact = { ...(profile.emergencyContact || {}), ...emergencyContact };
  }
  await profile.save();

  const full = await User.findById(user._id).populate('department').populate('manager').populate('employeeProfile');
  res.json({ success: true, message: 'Employee updated successfully.', user: serializeUser(full) });
});

const deleteEmployee = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return next(new AppError('Employee not found.', 404));
  if (String(user._id) === String(req.user._id)) {
    return next(new AppError('You cannot delete your own account.', 400));
  }
  if (req.body.hard === true) {
    await EmployeeProfile.deleteOne({ user: user._id });
    await User.deleteOne({ _id: user._id });
  } else {
    user.status = 'INACTIVE';
    await user.save({ validateBeforeSave: false });
    if (user.employeeProfile) {
      await EmployeeProfile.updateOne({ _id: user.employeeProfile }, { employmentStatus: 'INACTIVE' });
    }
  }
  res.json({ success: true, message: 'Employee deactivated successfully.' });
});

const updateStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['ACTIVE', 'INACTIVE', 'TERMINATED'].includes(status)) return next(new AppError('Invalid status.', 400));
  const user = await User.findByIdAndUpdate(id, { status }, { new: true });
  if (!user) return next(new AppError('Employee not found.', 404));
  res.json({ success: true, message: `Status updated to ${status}.` });
});

const getMyProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate('department')
    .populate('manager', 'firstName lastName email employeeId')
    .populate('employeeProfile');
  if (!user) return next(new AppError('User not found.', 404));
  const salary = await SalaryStructure.findOne({ user: user._id, isActive: true }).sort({ effectiveFrom: -1 });
  res.json({ success: true, data: { ...serializeUser(user), profile: user.employeeProfile, salaryStructure: salary } });
});

const updateMyProfile = asyncHandler(async (req, res, next) => {
  let profile = await EmployeeProfile.findOne({ user: req.user._id });
  if (!profile) {
    profile = await EmployeeProfile.create({ user: req.user._id });
    const u = await User.findById(req.user._id);
    u.employeeProfile = profile._id;
    await u.save({ validateBeforeSave: false });
  }

  const { phone, address, city, state, country, pincode, bloodGroup, gender, dob, emergencyContact, bank, skills, education, panNumber, passportNumber } = req.body;
  const fields = { phone, address, city, state, country, pincode, bloodGroup, gender, dob, skills, education, panNumber, passportNumber };
  Object.keys(fields).forEach((k) => {
    if (fields[k] !== undefined) profile[k] = fields[k];
  });
  if (emergencyContact) profile.emergencyContact = { ...(profile.emergencyContact || {}), ...emergencyContact };
  if (bank) profile.bank = { ...(profile.bank || {}), ...bank };
  await profile.save();

  res.json({ success: true, message: 'Profile updated successfully.', data: profile });
});

const uploadPhoto = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No photo uploaded.', 400));
  let profile = await EmployeeProfile.findOne({ user: req.user._id });
  if (!profile) {
    profile = await EmployeeProfile.create({ user: req.user._id });
    const u = await User.findById(req.user._id);
    u.employeeProfile = profile._id;
    await u.save({ validateBeforeSave: false });
  }
  profile.photo = req.file.path.replace(/\\/g, '/');
  await profile.save();
  res.json({ success: true, message: 'Photo updated.', photo: profile.photo });
});

const uploadEmployeePhoto = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!req.file) return next(new AppError('No photo uploaded.', 400));
  let profile = await EmployeeProfile.findOne({ user: id });
  if (!profile) return next(new AppError('Employee profile not found.', 404));
  profile.photo = req.file.path.replace(/\\/g, '/');
  await profile.save();
  res.json({ success: true, message: 'Photo updated.', photo: profile.photo });
});

const getManagers = asyncHandler(async (req, res) => {
  const managers = await User.find({ role: { $in: [ROLES.MANAGER, ROLES.HR_ADMIN] }, status: 'ACTIVE' })
    .select('firstName lastName email employeeId department role')
    .populate('department');
  res.json({ success: true, data: managers });
});

module.exports = {
  nextEmployeeId,
  DEFAULT_PASSWORD,
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
};
