const imageToPDF = require('./imageToPdf');
const convertToPDF = require('./convertToPDF'); // LibreOffice

async function normalizeToPDF(file) {
  if (!file || !file.mimetype || !file.buffer) {
    throw new Error('Invalid file object');
  }

  const { mimetype } = file;

  // ✅ Safe handling
  const originalname = file.originalname || '';
  const name = originalname.toLowerCase();

  console.log("Processing:", originalname || 'NO_NAME', mimetype);

  // ✅ DOCX + EXCEL → LibreOffice (FIXED)
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword' ||
    mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimetype === 'application/vnd.ms-excel' ||
    name.endsWith('.docx') ||
    name.endsWith('.doc') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.xls')
  ) {
    return await convertToPDF(file);
  }

  // ✅ IMAGE → local conversion
  if (mimetype.startsWith('image/')) {
    return await imageToPDF(file.buffer);
  }

  // ✅ PDF → already correct
  if (mimetype === 'application/pdf') {
    return file.buffer;
  }

  throw new Error(`Unsupported file type: ${originalname || mimetype}`);
}

module.exports = normalizeToPDF;

  