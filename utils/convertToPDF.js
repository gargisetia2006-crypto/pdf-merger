const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

async function convertToPDF(file) {
  const tempDir = path.join(__dirname, '../temp');

  const inputPath = path.join(tempDir, Date.now() + '-' + file.originalname);
  const outputPath = inputPath.replace(/\.(docx|xlsx)$/, '.pdf');

  // 1. Save file
  fs.writeFileSync(inputPath, file.buffer);

  // 2. Run LibreOffice
  return new Promise((resolve, reject) => {
    exec(
      `soffice --headless --convert-to pdf "${inputPath}" --outdir "${tempDir}"`,
      (error) => {
        if (error) return reject(error);

        try {
          // 3. Read PDF
          const pdfBuffer = fs.readFileSync(outputPath);

          // 4. Cleanup
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);

          resolve(pdfBuffer);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

module.exports = convertToPDF;