const imageToPDF = require('./imageToPdf');
const wordToPDF = require('./wordToPdf');
const excelToPDF = require('./excelToPdf');

async function normalizeToPDF(file) {

  if (!file || !file.mimetype || !file.buffer) {
    throw new Error('Invalid file object');
  }

const { mimetype, buffer, path } = file;

// IMAGE
if (mimetype.startsWith('image/')) {
  return await imageToPDF(buffer);
}

  // PDF
  if (mimetype === 'application/pdf') {
    return buffer;
  }

  // WORD
  if (
    mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    return await wordToPDF(buffer);
  }

  // EXCEL
  if (
    mimetype ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimetype === 'application/vnd.ms-excel'
  ) {
    return await excelToPDF(buffer);   // ✅ USE BUFFER
  }

  throw new Error(`Unsupported file type: ${mimetype}`);
}

module.exports = normalizeToPDF;
