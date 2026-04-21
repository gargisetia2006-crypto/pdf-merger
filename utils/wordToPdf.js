const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const libreOfficePath =
  '/Applications/LibreOffice.app/Contents/MacOS/soffice';

module.exports = function wordToPdf(wordBuffer) {
  return new Promise((resolve, reject) => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wordpdf-')
    );

    const inputPath = path.join(tempDir, 'input.docx');
    const outputDir = tempDir;

    fs.writeFileSync(inputPath, wordBuffer);

    const command = `"${libreOfficePath}" --headless --convert-to pdf "${inputPath}" --outdir "${outputDir}"`;

    exec(command, (err) => {
      if (err) return reject(err);

      const pdfPath = path.join(outputDir, 'input.pdf');

      if (!fs.existsSync(pdfPath)) {
        return reject(new Error('PDF not generated'));
      }

      const pdfBuffer = fs.readFileSync(pdfPath);
      resolve(pdfBuffer);
    });
  });
};
