const Department = require('../models/Department');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const listDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().populate('head', 'firstName lastName email').sort({ name: 1 });
  const withCount = await Promise.all(
    departments.map(async (d) => {
      const count = await User.countDocuments({ department: d._id, status: 'ACTIVE' });
      return { ...d.toObject(), employeeCount: count };
    })
  );
  res.json({ success: true, data: withCount });
});

const getDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id).populate('head', 'firstName lastName email');
  if (!department) return next(new AppError('Department not found.', 404));
  const employees = await User.find({ department: department._id })
    .select('firstName lastName email employeeId role status')
    .populate('department');
  res.json({ success: true, data: { ...department.toObject(), employees } });
});

const createDepartment = asyncHandler(async (req, res, next) => {
  const { name, code, description, head } = req.body;
  if (!name) return next(new AppError('Department name is required.', 400));
  const existing = await Department.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
  if (existing) return next(new AppError('Department with this name already exists.', 409));

  const department = await Department.create({
    name,
    code: code ? code.toUpperCase() : undefined,
    description: description || '',
    head,
  });
  res.status(201).json({ success: true, message: 'Department created.', data: department });
});

const updateDepartment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, code, description, head, status } = req.body;
  const department = await Department.findById(id);
  if (!department) return next(new AppError('Department not found.', 404));
  if (name) department.name = name;
  if (code) department.code = code.toUpperCase();
  if (description !== undefined) department.description = description;
  if (head !== undefined) department.head = head;
  if (status) department.status = status;
  await department.save();
  res.json({ success: true, message: 'Department updated.', data: department });
});

const deleteDepartment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const department = await Department.findById(id);
  if (!department) return next(new AppError('Department not found.', 404));
  const count = await User.countDocuments({ department: id, status: 'ACTIVE' });
  if (count > 0) return next(new AppError(`Cannot delete department with ${count} active employees. Reassign employees first.`, 400));
  department.status = 'INACTIVE';
  await department.save();
  res.json({ success: true, message: 'Department deactivated.' });
});

module.exports = { listDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment };
