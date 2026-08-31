const PDFDocument = require('pdfkit');
const { COMPANY } = require('../config/constants');
const { makeVerifyToken, toDataURL } = require('./qrService');
const { monthLabel } = require('../utils/dateUtils');

const COLORS = {
  primary: '#1e40af',
  dark: '#0f172a',
  light: '#64748b',
  accent: '#0ea5e9',
  border: '#cbd5e1',
  bg: '#f8fafc',
  success: '#16a34a',
  danger: '#dc2626',
};

const fmt = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '0.00';
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const drawLogo = (doc, x, y, size, text) => {
  const radius = 8;
  const grad = doc.linearGradient(x, y, x + size, y + size);
  grad.stop(0, '#1e40af');
  grad.stop(1, '#0ea5e9');
  doc.save();
  doc.roundedRect(x, y, size, size, radius);
  doc.fill(grad);
  doc.restore();
  const letter = (text || 'N').charAt(0).toUpperCase();
  doc.fillColor('#ffffff').fontSize(size * 0.55).font('Helvetica-Bold').text(letter, x + size * 0.34, y + size * 0.22);
  return { x, y, size };
};

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return '—';
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const generateIdCardPDF = async (user, profile, department) => {
  const doc = new PDFDocument({ size: [600, 375], margin: 0 });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const frontName = user.fullName || `${user.firstName} ${user.lastName}`;
  const empId = user.employeeId || 'N/A';
  const dept = department ? department.name : (profile && profile.designation ? profile.departmentName || '' : '');
  const designation = profile ? profile.designation : '';
  const joined = profile ? profile.joiningDate : user.createdAt;

  const qrText = makeVerifyToken(user._id, empId, user.email, department ? department.name : '', designation);
  const qrDataUrl = await toDataURL(qrText);

  doc.rect(0, 0, 600, 375).fill('#f1f5f9');

  doc.rect(0, 0, 600, 22).fill(COLORS.primary);
  doc.rect(0, 353, 600, 22).fill(COLORS.primary);

  drawLogo(doc, 30, 40, 54, COMPANY.name);
  doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(20).text(COMPANY.name, 100, 42);
  doc.fillColor(COLORS.light).font('Helvetica').fontSize(9).text('Corporate Employee Management Portal', 100, 66);
  doc.fillColor(COLORS.light).fontSize(8).text(`${COMPANY.address}`, 100, 80, { width: 340 });

  doc.fontSize(13).fillColor(COLORS.primary).font('Helvetica-Bold').text('EMPLOYEE IDENTITY CARD', 100, 108);

  if (profile && profile.photo) {
    try {
      doc.image(profile.photo, 470, 40, { width: 96, height: 96, fit: [96, 96] });
    } catch (e) {
      drawLogo(doc, 488, 58, 56, frontName);
    }
  } else {
    drawLogo(doc, 488, 58, 56, frontName);
  }

  doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(16).text(frontName, 30, 150);
  doc.fillColor(COLORS.light).font('Helvetica').fontSize(9).text(designation, 30, 168);

  const rows = [
    ['Employee ID', empId],
    ['Department', department ? department.name : '—'],
    ['Email', user.email],
    ['Joining Date', formatDate(joined)],
    ['Validity', formatDate(profile && profile.idCardValidity)],
    ['Blood Group', profile && profile.bloodGroup ? profile.bloodGroup : '—'],
  ];

  let y = 196;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.dark);
  rows.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').text(label.toUpperCase(), 30, y, { width: 90 });
    doc.font('Helvetica').fillColor('#334155').text(String(value), 130, y, { width: 300 });
    y += 22;
  });

  if (qrDataUrl) {
    doc.image(qrDataUrl, 470, 150, { width: 110, height: 110 });
    doc.fillColor(COLORS.light).font('Helvetica').fontSize(7).text('Scan to verify identity', 468, 268, { width: 115, align: 'center' });
  }

  doc.moveTo(0, 373).lineTo(600, 373).strokeColor(COLORS.accent).lineWidth(8).stroke();

  doc.end();
  return done;
};

const generatePayslipPDF = async (payslip, user, profile, department, structure) => {
  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const earn = payslip.earnings || {};
  const ded = payslip.deductions || {};
  const sum = payslip.attendanceSummary || {};

  doc.rect(0, 0, 595.28, 64).fill(COLORS.primary);
  drawLogo(doc, 36, 16, 32, COMPANY.name);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16).text(COMPANY.name, 78, 16);
  doc.fillColor('#e2e8f0').font('Helvetica').fontSize(8).text(COMPANY.address, 78, 36, { width: 380 });
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(14).text('SALARY SLIP', 440, 18, { width: 120, align: 'right' });
  doc.fillColor('#e2e8f0').font('Helvetica').fontSize(9).text(monthLabel(payslip.month, payslip.year), 440, 38, { width: 120, align: 'right' });

  doc.rect(0, 64, 595.28, 6).fill(COLORS.accent);

  let y = 88;
  doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(11).text('EMPLOYEE DETAILS', 36, y);
  y += 22;
  doc.font('Helvetica').fontSize(9).fillColor('#334155');
  doc.text(`Employee: ${user.fullName || ''}`, 36, y);
  doc.text(`Employee ID: ${user.employeeId || '—'}`, 220, y);
  doc.text(`Department: ${department ? department.name : '—'}`, 380, y);
  y += 15;
  doc.text(`Designation: ${profile ? profile.designation : '—'}`, 36, y);
  doc.text(`Bank: ${profile && profile.bank ? profile.bank.bankName || '—' : '—'}`, 220, y);
  doc.text(`Pay Period: ${monthLabel(payslip.month, payslip.year)}`, 380, y);
  y += 15;
  doc.text(`Account No: ${profile && profile.bank && profile.bank.accountNumber ? 'XXXX' + String(profile.bank.accountNumber).slice(-4) : '—'}`, 36, y);
  doc.text(`IFSC: ${profile && profile.bank ? profile.bank.ifsc || '—' : '—'}`, 220, y);
  doc.text(`Status: ${payslip.status}`, 380, y);
  y += 20;

  doc.rect(36, y, 523, 1).fill(COLORS.border);
  y += 14;

  doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(11).text('ATTENDANCE SUMMARY', 36, y);
  y += 18;
  const attendanceRows = [
    ['Present Days', sum.presentDays || 0],
    ['Half Days', sum.halfDays || 0],
    ['Paid Leave', sum.paidLeaveDays || 0],
    ['Unpaid Leave', sum.unpaidLeaveDays || 0],
    ['Absent Days', sum.absentDays || 0],
    ['Holidays', sum.holidays || 0],
    ['Working Days', sum.workingDays || 0],
    ['Payable Days', payslip.proratedDays || 0],
  ];
  doc.font('Helvetica').fontSize(9);
  attendanceRows.forEach(([label, value], i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 36 + col * 131;
    const ry = y + row * 18;
    doc.fillColor('#64748b').text(label, x, ry, { width: 90 });
    doc.fillColor('#0f172a').font('Helvetica-Bold').text(String(value), x + 92, ry, { width: 36, align: 'right' });
    doc.font('Helvetica');
  });
  y += 40;

  doc.rect(36, y, 523, 1).fill(COLORS.border);
  y += 14;

  doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(11).text('EARNINGS', 36, y);
  doc.text('AMOUNT (₹)', 452, y, { width: 107, align: 'right' });
  y += 18;

  const earningRows = [
    ['Basic Salary', earn.basicSalary || 0],
    ['House Rent Allowance', earn.hra || 0],
    ['Special Allowance', earn.specialAllowance || 0],
    ['Conveyance Allowance', earn.conveyanceAllowance || 0],
    ['Medical Allowance', earn.medicalAllowance || 0],
    ['Travel Allowance', earn.travelAllowance || 0],
    ['Bonus', earn.bonus || 0],
    ['Performance Pay', earn.performancePay || 0],
    ['Other Earnings', earn.otherEarnings || 0],
  ];
  doc.font('Helvetica').fontSize(9);
  earningRows.forEach(([label, value]) => {
    doc.fillColor('#334155').text(label, 36, y, { width: 320 });
    doc.fillColor('#0f172a').text(fmt(value), 452, y, { width: 107, align: 'right' });
    y += 16;
  });
  doc.rect(36, y, 523, 1).fill(COLORS.border);
  y += 8;
  doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.dark).text('GROSS SALARY', 36, y);
  doc.text(fmt(earn.grossSalary || 0), 452, y, { width: 107, align: 'right' });
  y += 26;

  doc.rect(36, y, 523, 1).fill(COLORS.border);
  y += 14;
  doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(11).text('DEDUCTIONS', 36, y);
  y += 18;
  const deductionRows = [
    ['Provident Fund', ded.pf || 0],
    ['Professional Tax', ded.professionalTax || 0],
    ['Income Tax (TDS)', ded.incomeTax || 0],
    ['Insurance', ded.insuranceDeduction || 0],
    ['Loan Recovery', ded.loanDeduction || 0],
    ['Other Deductions', ded.otherDeductions || 0],
    ['Unpaid Leave / Absence', payslip.leaveDeduction || 0],
  ];
  doc.font('Helvetica').fontSize(9);
  deductionRows.forEach(([label, value]) => {
    doc.fillColor('#334155').text(label, 36, y, { width: 320 });
    doc.fillColor('#0f172a').text(fmt(value), 452, y, { width: 107, align: 'right' });
    y += 16;
  });
  doc.rect(36, y, 523, 1).fill(COLORS.border);
  y += 8;
  doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.danger).text('TOTAL DEDUCTIONS', 36, y);
  doc.text(fmt(ded.totalDeductions || 0), 452, y, { width: 107, align: 'right' });
  y += 26;

  doc.rect(36, y, 523, 36).fill(COLORS.bg);
  doc.fillColor(COLORS.success).font('Helvetica-Bold').fontSize(14).text('NET PAYABLE', 46, y + 10);
  doc.fillColor(COLORS.dark).text(`₹ ${fmt(payslip.netSalary || 0)}`, 420, y + 10, { width: 129, align: 'right' });

  y += 56;
  doc.fillColor(COLORS.light).font('Helvetica').fontSize(8).text(
    `This is a computer generated payslip and does not require a signature. Generated on ${new Date(payslip.updatedAt || Date.now()).toLocaleDateString('en-IN')}.`,
    36, y, { width: 523 }
  );
  doc.text(`For any discrepancies, contact HR at ${COMPANY.email}.`, 36, y + 12, { width: 523 });

  doc.end();
  return done;
};

module.exports = { generateIdCardPDF, generatePayslipPDF };
