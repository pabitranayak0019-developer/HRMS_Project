const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const env = require('./config/env');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: env.CLIENT_URL === '*' ? '*' : env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (env.NODE_ENV !== 'production') app.use(morgan('dev'));

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
fs.mkdirSync(path.join(uploadDir, 'photos'), { recursive: true });
fs.mkdirSync(path.join(uploadDir, 'receipts'), { recursive: true });
fs.mkdirSync(path.join(uploadDir, 'documents'), { recursive: true });
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'HRMS API is running', time: new Date().toISOString() }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));
app.use('/api/payslips', require('./routes/payslipRoutes'));
app.use('/api/holidays', require('./routes/holidayRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/performance', require('./routes/performanceRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/idcard', require('./routes/idcardRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`HRMS API running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Set PORT in .env to another value.`);
      process.exit(1);
    }
    throw err;
  });
};

start();
