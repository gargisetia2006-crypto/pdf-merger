const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

async function convertToPDF(file) {
  const tempDir = path.join(__dirname, '../temp');

  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Safe filename
  const originalName = file.originalname || `file-${Date.now()}.docx`;
  const safeName = originalName.replace(/\s+/g, '_');

  const timestamp = Date.now();
  const inputPath = path.join(tempDir, `${timestamp}-${safeName}`);

  console.log("Input Path:", inputPath);

  // Save file
  fs.writeFileSync(inputPath, file.buffer);

  const command = `soffice --headless --nologo --nolockcheck --nodefault --nofirststartwizard --convert-to pdf "${inputPath}" --outdir "${tempDir}"`;

  return new Promise((resolve, reject) => {
    exec(command, { timeout: 20000 }, (error, stdout, stderr) => {
      console.log("STDOUT:", stdout);
      console.log("STDERR:", stderr);

      if (error) {
        console.error("LibreOffice error:", error);
        return reject(error);
      }

      // 🔥 REAL FIX: find actual generated PDF
      let attempts = 0;
      const maxAttempts = 10;

      const checkFile = () => {
        const files = fs.readdirSync(tempDir);

        // Match PDF related to this file
        const pdfFile = files.find(f =>
          f.endsWith('.pdf') &&
          f.includes(safeName.split('.')[0])
        );

        if (pdfFile) {
          const outputPath = path.join(tempDir, pdfFile);

          try {
            const pdfBuffer = fs.readFileSync(outputPath);

            // Cleanup
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);

            return resolve(pdfBuffer);
          } catch (err) {
            return reject(err);
          }
        }

        attempts++;
        if (attempts > maxAttempts) {
          return reject(new Error("PDF not generated"));
        }

        setTimeout(checkFile, 500);
      };

      checkFile();
    });
  });
}

module.exports = convertToPDF;