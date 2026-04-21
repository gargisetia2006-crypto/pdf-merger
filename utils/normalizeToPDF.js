const imageToPDF = require('./imageToPdf');
const convertToPDF = require('./cloudConvert');

async function normalizeToPDF(file) {
  if (!file || !file.mimetype || !file.buffer) {
    throw new Error('Invalid file object');
  }

  const { mimetype } = file;

  // IMAGE → local conversion
  if (mimetype.startsWith('image/')) {
    return await imageToPDF(file.buffer);
  }

  // PDF → already correct
  if (mimetype === 'application/pdf') {
    return file.buffer;
  }

  // WORD + EXCEL → CloudConvert
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword' ||
    mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimetype === 'application/vnd.ms-excel'
  ) {
    return await convertToPDF(file);   // ✅ pass full file (IMPORTANT)
  }

  // fallback (optional safety)
  if (
    mimetype.includes('word') ||
    mimetype.includes('excel') ||
    mimetype.includes('spreadsheet')
  ) {
    return await convertToPDF(file);
  }

  throw new Error(`Unsupported file type: ${mimetype}`);
}

module.exports = normalizeToPDF;