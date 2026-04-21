const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

async function convertToPDF(file) {
  const tempDir = path.join(__dirname, '../temp');

  // ✅ SAFE filename handling
  const originalName = file.originalname || `file-${Date.now()}.docx`;
  const safeName = originalName.replace(/\s+/g, '_');

  const inputPath = path.join(tempDir, `${Date.now()}-${safeName}`);
  const outputPath = inputPath.replace(/\.(docx|doc|xlsx|xls)$/i, '.pdf');

  // 1. Save file
  fs.writeFileSync(inputPath, file.buffer);

  // 2. Run LibreOffice (FULL PATH FIX)
  const command = `/Applications/LibreOffice.app/Contents/MacOS/soffice --headless --convert-to pdf "${inputPath}" --outdir "${tempDir}"`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("LibreOffice error:", stderr);
        return reject(error);
      }

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
    });
  });
}

module.exports = convertToPDF;