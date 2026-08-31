const QRCode = require('qrcode');
const { COMPANY } = require('../config/constants');
const env = require('../config/env');

const COMPANY_NAME = COMPANY.name;
const COMPANY_URL = COMPANY.website || 'https://hrms.example';

const makeVerifyToken = (userId, employeeId, email, dept, designation) => {
  const payload = {
    type: 'EMP_ID',
    id: String(userId),
    employeeId,
    name: '',
    department: dept || '',
    designation: designation || '',
    issuer: COMPANY_NAME,
    issuedAt: new Date().toISOString(),
    verifyUrl: `${env.CLIENT_URL}/verify/${String(userId)}`,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
};

const toDataURL = async (text) => {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 200,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  } catch (err) {
    console.error(`QR generation failed: ${err.message}`);
    return null;
  }
};

module.exports = { makeVerifyToken, toDataURL, COMPANY_NAME, COMPANY_URL };
