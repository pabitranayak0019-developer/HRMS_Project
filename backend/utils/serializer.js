const serializeUser = (user) => {
  if (!user) return null;
  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    employeeId: user.employeeId || '',
    role: user.role,
    status: user.status,
    department: user.department
      ? { _id: user.department._id, name: user.department.name }
      : null,
    manager: user.manager ? { _id: user.manager._id, fullName: user.manager.fullName } : null,
    employeeProfile: user.employeeProfile ? user.employeeProfile._id : null,
    createdAt: user.createdAt,
  };
};

module.exports = { serializeUser };
