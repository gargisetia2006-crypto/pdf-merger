const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

async function convertToPDF(file) {
  const tempDir = path.join(__dirname, '../temp');

  // ✅ Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // ✅ Safe filename handling
  const originalName = file.originalname || `file-${Date.now()}.docx`;
  const safeName = originalName.replace(/\s+/g, '_');

  const inputPath = path.join(tempDir, `${Date.now()}-${safeName}`);
  const outputPath = inputPath.replace(/\.(docx|doc|xlsx|xls)$/i, '.pdf');

  console.log("Input Path:", inputPath);
  console.log("Output Path:", outputPath);

  // 1. Save file
  fs.writeFileSync(inputPath, file.buffer);

  // 2. Run LibreOffice
  const command = `soffice --headless --nologo --nolockcheck --nodefault --nofirststartwizard --convert-to pdf "${inputPath}" --outdir "${tempDir}"`;

  return new Promise((resolve, reject) => {
    exec(command, { timeout: 20000 }, (error, stdout, stderr) => {
      console.log("STDOUT:", stdout);
      console.log("STDERR:", stderr);

      if (error) {
        console.error("LibreOffice error:", error);
        return reject(error);
      }

      // ✅ Wait until file is actually created
      let attempts = 0;
      const maxAttempts = 10;

      const checkFile = () => {
        if (fs.existsSync(outputPath)) {
          try {
            const pdfBuffer = fs.readFileSync(outputPath);

            // Cleanup
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);

            return resolve(pdfBuffer);
          } catch (err) {
            return reject(err);
          }
        } else {
          attempts++;
          if (attempts > maxAttempts) {
            return reject(new Error("PDF not generated"));
          }
          setTimeout(checkFile, 500);
        }
      };

      checkFile();
    });
  });
}

module.exports = convertToPDF;