const imageToPDF = require('./imageToPdf');
const convertToPDF = require('./convertToPDF'); // ✅ NEW (LibreOffice)

async function normalizeToPDF(file) {
  if (!file || !file.mimetype || !file.buffer) {
    throw new Error('Invalid file object');
  }

  const { mimetype, originalname } = file;

  console.log("Processing:", originalname, mimetype);

  // ✅ DOCX + EXCEL (use LibreOffice)
  if (
    originalname.endsWith('.docx') ||
    originalname.endsWith('.doc') ||
    originalname.endsWith('.xlsx') ||
    originalname.endsWith('.xls')
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

  throw new Error(`Unsupported file type: ${originalname}`);
}

module.exports = normalizeToPDF;