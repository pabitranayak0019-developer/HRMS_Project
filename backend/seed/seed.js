const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

require('../config/env');

const connectDB = require('../config/db');
const User = require('../models/User');
const EmployeeProfile = require('../models/EmployeeProfile');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const SalaryStructure = require('../models/SalaryStructure');
const Holiday = require('../models/Holiday');
const Announcement = require('../models/Announcement');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const ExpenseClaim = require('../models/ExpenseClaim');
const PerformanceReview = require('../models/PerformanceReview');
const Payslip = require('../models/Payslip');
const { ROLES } = require('../config/constants');
const { startOfDay, toISODate } = require('../utils/dateUtils');
const { generatePayrollForMonth } = require('../services/payrollService');

const DEMO_PASSWORD = 'Welcome@123';
const nextEmpId = (n) => `EMP-${n}`;

const seed = async () => {
  await connectDB();

  console.log('Clearing existing data...');
  const collections = [
    User, EmployeeProfile, Department, Attendance, LeaveRequest, SalaryStructure,
    Holiday, Announcement, Document, Notification, ExpenseClaim, PerformanceReview, Payslip,
  ];
  for (const c of collections) {
    try {
      await c.deleteMany({});
    } catch (err) {
      console.log(`  skip clear ${c.modelName}: ${err.message}`);
    }
  }

  console.log('Creating departments...');
  const [engineering, hr, finance, marketing, sales, operations] = await Department.create([
    { name: 'Engineering', code: 'ENG', description: 'Software development and product engineering.' },
    { name: 'Human Resources', code: 'HR', description: 'People operations, hiring and culture.' },
    { name: 'Finance', code: 'FIN', description: 'Accounting, payroll and financial planning.' },
    { name: 'Marketing', code: 'MKT', description: 'Brand, growth and communications.' },
    { name: 'Sales', code: 'SAL', description: 'Revenue and customer acquisition.' },
    { name: 'Operations', code: 'OPS', description: 'Business operations and support.' },
  ]);

  const dept = { engineering, hr, finance, marketing, sales, operations };

  console.log('Creating users & profiles...');
  let seedCounter = 1000;  const mkUser = async ({ firstName, lastName, email, role, department, manager, designation, joiningDate, extra }) => {
    seedCounter += 1;
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: DEMO_PASSWORD,
      role,
      department,
      manager,
      employeeId: await nextEmpId(seedCounter),
      status: 'ACTIVE',
    });
    const profile = await EmployeeProfile.create({
      user: user._id,
      designation,
      joiningDate,
      gender: extra.gender || 'MALE',
      phone: extra.phone || '98765 43210',
      bloodGroup: extra.bloodGroup || 'B+',
      address: extra.address || 'Sector 62, Noida, Uttar Pradesh',
      city: extra.city || 'Noida',
      state: extra.state || 'Uttar Pradesh',
      country: 'India',
      pincode: '201301',
      bank: {
        accountName: `${firstName} ${lastName}`,
        accountNumber: extra.accountNumber || `9876543210${String(Math.floor(Math.random() * 90) + 10)}`,
        ifsc: extra.ifsc || 'HDFC0001234',
        bankName: extra.bankName || 'HDFC Bank',
        branch: 'Noida Sector 62',
      },
      emergencyContact: {
        name: extra.emergencyName || 'Mrs. ' + lastName,
        relation: 'Spouse',
        phone: '90000 00000',
      },
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      idCardValidity: new Date(new Date(joiningDate).getFullYear() + 2, 0, 1),
      skills: extra.skills || [],
      education: extra.education || "Bachelor's Degree",
    });
    user.employeeProfile = profile._id;
    await user.save({ validateBeforeSave: false });
    return user;
  };

  const yearsAgo = (y, m = 0, d = 1) => {
    const dt = new Date();
    dt.setFullYear(dt.getFullYear() - y);
    dt.setMonth(dt.getMonth() - m);
    dt.setDate(Math.min(d, new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate()));
    return dt;
  };

  const hrAdmin = await mkUser({
    firstName: 'Aarav', lastName: 'Sharma', email: 'hr@nexuscorp.example', role: ROLES.HR_ADMIN,
    department: hr._id, designation: 'HR Director', joiningDate: yearsAgo(6), extra: { gender: 'MALE', accountNumber: '1111222233', skills: ['HR', 'Payroll'] },
  });

  const managerEng = await mkUser({
    firstName: 'Priya', lastName: 'Verma', email: 'manager@nexuscorp.example', role: ROLES.MANAGER,
    department: engineering._id, designation: 'Engineering Manager', joiningDate: yearsAgo(4), extra: { gender: 'FEMALE', accountNumber: '2222333344', skills: ['Leadership', 'Node.js'] },
  });

  const managerSales = await mkUser({
    firstName: 'Rahul', lastName: 'Kapoor', email: 'rahul.kapoor@nexuscorp.example', role: ROLES.MANAGER,
    department: sales._id, designation: 'Sales Manager', joiningDate: yearsAgo(3), extra: { gender: 'MALE', accountNumber: '3333444455', skills: ['Sales', 'CRM'] },
  });

  const emp1 = await mkUser({
    firstName: 'Ananya', lastName: 'Singh', email: 'employee@nexuscorp.example', role: ROLES.EMPLOYEE,
    department: engineering._id, manager: managerEng._id, designation: 'Senior Software Engineer', joiningDate: yearsAgo(2, 6),
    extra: { gender: 'FEMALE', accountNumber: '4444555566', skills: ['React', 'Node.js', 'MongoDB'], bloodGroup: 'O+' },
  });

  const emp2 = await mkUser({
    firstName: 'Vikram', lastName: 'Mehta', email: 'vikram.mehta@nexuscorp.example', role: ROLES.EMPLOYEE,
    department: engineering._id, manager: managerEng._id, designation: 'Software Engineer', joiningDate: yearsAgo(1, 3),
    extra: { gender: 'MALE', accountNumber: '5555666677', skills: ['Python', 'AWS'], bloodGroup: 'A+' },
  });

  const emp3 = await mkUser({
    firstName: 'Sneha', lastName: 'Reddy', email: 'sneha.reddy@nexuscorp.example', role: ROLES.EMPLOYEE,
    department: engineering._id, manager: managerEng._id, designation: 'UI/UX Designer', joiningDate: yearsAgo(2),
    extra: { gender: 'FEMALE', accountNumber: '6666777788', skills: ['Figma', 'Design Systems'], bloodGroup: 'AB+' },
  });

  const emp4 = await mkUser({
    firstName: 'Rohan', lastName: 'Gupta', email: 'rohan.gupta@nexuscorp.example', role: ROLES.EMPLOYEE,
    department: finance._id, manager: hrAdmin._id, designation: 'Finance Analyst', joiningDate: yearsAgo(1, 6),
    extra: { gender: 'MALE', accountNumber: '7777888899', skills: ['Accounting', 'Excel'], bloodGroup: 'B-' },
  });

  const emp5 = await mkUser({
    firstName: 'Kavya', lastName: 'Nair', email: 'kavya.nair@nexuscorp.example', role: ROLES.EMPLOYEE,
    department: marketing._id, manager: hrAdmin._id, designation: 'Marketing Executive', joiningDate: yearsAgo(0, 9),
    extra: { gender: 'FEMALE', accountNumber: '8888999900', skills: ['SEO', 'Content'], bloodGroup: 'O-' },
  });

  const employees = [emp1, emp2, emp3, emp4, emp5];
  const allUsers = [hrAdmin, managerEng, managerSales, ...employees];

  console.log('Creating salary structures...');
  const mkStructure = async (user, base, factor, extraDed) => {
    const basic = base * factor;
    return SalaryStructure.create({
      user: user._id,
      effectiveFrom: yearsAgo(1),
      basicSalary: Math.round(basic),
      hra: Math.round(basic * 0.4),
      specialAllowance: Math.round(basic * 0.3),
      conveyanceAllowance: 1600,
      medicalAllowance: 1250,
      travelAllowance: 2000,
      bonus: 0,
      performancePay: 0,
      otherEarnings: 0,
      pf: Math.round(basic * 0.12),
      professionalTax: 200,
      incomeTax: Math.round(basic * 0.05),
      insuranceDeduction: 1250,
      loanDeduction: 0,
      otherDeductions: 0,
      isActive: true,
    });
  };

  await mkStructure(emp1, 70000, 1, 0);
  await mkStructure(emp2, 50000, 1, 0);
  await mkStructure(emp3, 45000, 1, 0);
  await mkStructure(emp4, 42000, 1, 0);
  await mkStructure(emp5, 35000, 1, 0);
  await mkStructure(managerEng, 95000, 1, 0);
  await mkStructure(managerSales, 88000, 1, 0);
  await mkStructure(hrAdmin, 110000, 1, 0);

  console.log('Creating holidays...');
  const mkHoliday = (name, date, type, description) => Holiday.create({ name, date, type, description, isActive: true });
  const now = new Date();
  const y = now.getFullYear();
  await Promise.all([
    mkHoliday('Republic Day', new Date(y, 0, 26), 'PUBLIC', 'National holiday'),
    mkHoliday('Holi', new Date(y, 2, Math.min(25, 20)), 'PUBLIC', 'Festival of colours'),
    mkHoliday('Independence Day', new Date(y, 7, 15), 'PUBLIC', 'National holiday'),
    mkHoliday('Gandhi Jayanti', new Date(y, 9, 2), 'PUBLIC', 'National holiday'),
    mkHoliday('Diwali', new Date(y, 10, Math.min(20, 15)), 'COMPANY', 'Festival of lights'),
    mkHoliday('Christmas', new Date(y, 11, 25), 'PUBLIC', 'Christmas'),
  ]);

  console.log('Creating announcements...');
  await Announcement.create([
    {
      title: 'Company Annual Offsite 2026',
      description: 'The annual team offsite is scheduled for the last week of December at Jaipur. Please plan your leaves accordingly. Details will follow.',
      priority: 'HIGH',
      pinned: true,
      createdBy: hrAdmin._id,
    },
    {
      title: 'New Leave Policy',
      description: 'From next month, sick leave can be availed without prior approval for up to 2 days. Kindly inform your manager by 10 AM on the day of leave.',
      priority: 'NORMAL',
      createdBy: hrAdmin._id,
    },
    {
      title: 'Diwali Bonus Announcement',
      description: 'All employees will receive a festive bonus along with the October payslip. Tax implications will be communicated by finance.',
      priority: 'URGENT',
      createdBy: hrAdmin._id,
    },
    {
      title: 'Office Timings Update',
      description: 'Flexible timing (9:00 AM - 11:00 AM start) is now available for all departments. Minimum 8 hours of work per day is mandatory.',
      priority: 'NORMAL',
      createdBy: hrAdmin._id,
    },
  ]);

  console.log('Creating attendance for previous + current month...');
  const seedAttendance = async (user, monthOffset, opts = {}) => {
    const target = new Date();
    target.setDate(1);
    target.setMonth(target.getMonth() - monthOffset);
    const days = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    const skip = opts.skip || [];
    const lateDays = opts.lateDays || [];
    const halfDays = opts.halfDays || [];

    for (let d = 1; d <= days; d++) {
      const date = new Date(target.getFullYear(), target.getMonth(), d);
      if (date >= startOfDay(new Date())) break;
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      if (skip.includes(d)) continue;

      const holiday = await Holiday.findOne({ date: { $gte: startOfDay(date), $lte: new Date(date.setHours(23, 59, 59, 999)) }, isActive: true });
      if (holiday) continue;

      const leave = await LeaveRequest.findOne({
        user: user._id, status: 'APPROVED',
        startDate: { $lte: new Date(target.getFullYear(), target.getMonth(), d, 23, 59, 59) },
        endDate: { $gte: new Date(target.getFullYear(), target.getMonth(), d, 0, 0, 0) },
      });
      if (leave) continue;

      const clockIn = new Date(target.getFullYear(), target.getMonth(), d, lateDays.includes(d) ? 10 : 9, lateDays.includes(d) ? 15 : 5 + (Math.floor(Math.random() * 10)), 0);
      const clockOut = new Date(target.getFullYear(), target.getMonth(), d, 18, 30 + Math.floor(Math.random() * 60), 0);
      const hours = (clockOut - clockIn) / 3600000;

      await Attendance.create({
        user: user._id,
        date: startOfDay(date),
        clockIn,
        clockOut,
        workingHours: Math.round(hours * 100) / 100,
        overtimeHours: 0,
        isLate: lateDays.includes(d),
        lateMinutes: lateDays.includes(d) ? 75 : 0,
        status: halfDays.includes(d) ? 'HALF_DAY' : 'PRESENT',
      });
    }
  };

  for (const emp of employees) {
    await seedAttendance(emp, 2, { skip: [7, 21], lateDays: [10] });
    await seedAttendance(emp, 1, { skip: [8], halfDays: [15] });
    await seedAttendance(emp, 0, { skip: [], lateDays: [3, 12] });
  }

  console.log('Creating leave requests...');
  const monthStart = new Date();
  monthStart.setDate(1);
  const nextMonth = new Date(monthStart);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const leave1 = await LeaveRequest.create({
    user: emp2._id, leaveType: 'SICK_LEAVE', duration: 'FULL_DAY',
    startDate: new Date(y, now.getMonth(), Math.min(now.getDate() + 5, 28)), endDate: new Date(y, now.getMonth(), Math.min(now.getDate() + 5, 28)),
    numberOfDays: 1, reason: 'Viral fever, need rest.', status: 'PENDING',
  });
  const leave2 = await LeaveRequest.create({
    user: emp3._id, leaveType: 'CASUAL_LEAVE', duration: 'FULL_DAY',
    startDate: new Date(y, now.getMonth(), Math.min(now.getDate() + 10, 28)), endDate: new Date(y, now.getMonth(), Math.min(now.getDate() + 11, 28)),
    numberOfDays: 2, reason: 'Family function out of station.', status: 'PENDING',
  });
  const leave3 = await LeaveRequest.create({
    user: emp4._id, leaveType: 'PAID_LEAVE', duration: 'FULL_DAY',
    startDate: new Date(y, now.getMonth() - 1, 10), endDate: new Date(y, now.getMonth() - 1, 11),
    numberOfDays: 2, reason: 'Personal work.', status: 'APPROVED', approver: hrAdmin._id,
  });
  const leave4 = await LeaveRequest.create({
    user: emp5._id, leaveType: 'CASUAL_LEAVE', duration: 'HALF_DAY',
    startDate: new Date(y, now.getMonth() - 1, 18), endDate: new Date(y, now.getMonth() - 1, 18),
    numberOfDays: 0.5, reason: 'Doctor appointment.', status: 'APPROVED', approver: hrAdmin._id,
  });
  const leave5 = await LeaveRequest.create({
    user: emp1._id, leaveType: 'UNPAID_LEAVE', duration: 'FULL_DAY',
    startDate: new Date(y, now.getMonth(), Math.min(now.getDate() + 12, 28)), endDate: new Date(y, now.getMonth(), Math.min(now.getDate() + 12, 28)),
    numberOfDays: 1, reason: 'Personal emergency.', status: 'PENDING',
  });
  const leave6 = await LeaveRequest.create({
    user: emp2._id, leaveType: 'SICK_LEAVE', duration: 'FULL_DAY',
    startDate: new Date(y, now.getMonth() - 2, 12), endDate: new Date(y, now.getMonth() - 2, 13),
    numberOfDays: 2, reason: 'Flu.', status: 'APPROVED', approver: managerEng._id,
  });

  console.log('Creating expenses...');
  const expenses = await Promise.all([
    ExpenseClaim.create({ user: emp1._id, title: 'Client dinner', category: 'CLIENT_ENTERTAINMENT', amount: 4500, expenseDate: new Date(y, now.getMonth(), 4), description: 'Dinner with client team at Shangri-La.', status: 'PENDING' }),
    ExpenseClaim.create({ user: emp2._id, title: 'Cab to airport', category: 'TRAVEL', amount: 800, expenseDate: new Date(y, now.getMonth() - 1, 20), description: 'Airport pickup for client visit.', status: 'APPROVED', approver: managerEng._id, approvedAmount: 750 }),
    ExpenseClaim.create({ user: emp3._id, title: 'Design software license', category: 'OFFICE_SUPPLIES', amount: 2200, expenseDate: new Date(y, now.getMonth() - 1, 5), description: 'Monthly Figma subscription.', status: 'REJECTED', approver: managerEng._id, approvalComment: 'Please use company license key.' }),
    ExpenseClaim.create({ user: emp4._id, title: 'Fuel reimbursement', category: 'FUEL', amount: 1500, expenseDate: new Date(y, now.getMonth(), 2), description: 'Client office visits.', status: 'PENDING' }),
  ]);

  console.log('Creating performance reviews...');
  await PerformanceReview.create([
    {
      user: emp1._id, manager: managerEng._id, period: 'H1 2026',
      goals: [
        { title: 'Complete analytics dashboard revamp', description: 'Ship new analytics module.', weight: 40, status: 'IN_PROGRESS' },
        { title: 'Mentor 2 junior engineers', description: 'Pair programming and code reviews.', weight: 30, status: 'IN_PROGRESS' },
      ],
      ratings: { technicalSkills: 4, communication: 4, teamwork: 5, initiative: 4, punctuality: 4, overallRating: 4.2 },
      strengths: 'Strong technical depth and ownership.',
      improvements: 'Share learnings more proactively.',
      managerComments: 'Excellent quarter, keep up.',
      status: 'SUBMITTED',
    },
    {
      user: emp2._id, manager: managerEng._id, period: 'Q1 2026',
      goals: [{ title: 'Migrate auth service', description: 'Move to JWT + refresh tokens.', weight: 50, status: 'ACHIEVED' }],
      ratings: { technicalSkills: 4, communication: 3, teamwork: 4, initiative: 3, punctuality: 5, overallRating: 3.8 },
      strengths: 'Reliable and consistent.',
      improvements: 'Improve documentation.',
      managerComments: 'Good progress.',
      status: 'COMPLETED',
    },
  ]);

  console.log('Creating notifications...');
  const notifTemplates = [
    { recipient: emp1._id, type: 'LEAVE_SUBMITTED', title: 'Leave request submitted', message: 'Your UNPAID_LEAVE request is pending approval.', link: '/leaves' },
    { recipient: emp1._id, type: 'PAYSLIP_GENERATED', title: 'Payslip generated', message: 'Your latest payslip is ready to view.', link: '/payslips' },
    { recipient: managerEng._id, type: 'LEAVE_SUBMITTED', title: 'New leave request', message: 'Ananya Singh applied for 1 day unpaid leave.', link: '/manager/leave-approvals' },
    { recipient: emp2._id, type: 'LEAVE_SUBMITTED', title: 'Leave request submitted', message: 'Your SICK_LEAVE request is pending approval.', link: '/leaves' },
  ];
  await Notification.insertMany(notifTemplates);

  console.log('Creating documents...');
  const docDir = path.resolve(process.cwd(), 'uploads/documents');
  fs.mkdirSync(docDir, { recursive: true });
  const mkDoc = async (title, category, fileName, content, uploadedBy, visibility = 'PUBLIC', department = null) => {
    const filePath = path.join(docDir, fileName);
    fs.writeFileSync(filePath, content);
    return Document.create({
      title, category, fileName, filePath: filePath.replace(/\\/g, '/'),
      fileSize: Buffer.byteLength(content), mimeType: 'text/plain',
      uploadedBy, visibility, department, isActive: true,
    });
  };
  await mkDoc('Employee Handbook 2026', 'HR_POLICY', 'employee_handbook.txt', 'Welcome to Nexus Corp. This handbook covers code of conduct, leave policy and workplace ethics.', hrAdmin._id, 'PUBLIC');
  await mkDoc('Offer Letter — Ananya Singh', 'OFFER_LETTER', 'offer_ananya.txt', 'This confirms your appointment as Senior Software Engineer at Nexus Corp effective ' + emp1.employeeProfile?.joiningDate?.toDateString(), hrAdmin._id, 'PRIVATE', null);
  await mkDoc('Remote Work Policy', 'HR_POLICY', 'remote_policy.txt', 'Employees may work remotely up to 2 days per week with manager approval.', hrAdmin._id, 'PUBLIC');

  console.log('Generating payslips for previous 3 months...');
  for (let offset = 1; offset <= 3; offset++) {
    const d = new Date();
    const month = d.getMonth() + 1 - offset;
    const y = d.getFullYear();
    const m = ((month - 1 + 12) % 12) + 1;
    const yy = month <= 0 ? y - 1 : y;
    await generatePayrollForMonth(m, yy);
  }

  console.log('\n========== SEED COMPLETE ==========');
  console.log('Demo Credentials (password for all: Welcome@123)');
  console.log(`  HR Admin    → hr@nexuscorp.example`);
  console.log(`  Manager     → manager@nexuscorp.example`);
  console.log(`  Employee    → employee@nexuscorp.example`);
  console.log('====================================');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
