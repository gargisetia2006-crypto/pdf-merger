const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');

async function imageToPdf(imageBuffer){

  const processedBuffer = await sharp(imageBuffer)
    .rotate()
    .png()
    .toBuffer();

  const pdfDoc = await PDFDocument.create();
  const image = await pdfDoc.embedPng(processedBuffer);

  // 2️⃣ A4 width (points)
  const A4_WIDTH = 595.28;
  const MARGIN = 20;

  const imgWidth = image.width;
  const imgHeight = image.height;

  // 3️⃣ Scale image so WIDTH == A4 (minus margins)
  const usableWidth = A4_WIDTH - MARGIN * 2;
  const scale = usableWidth / imgWidth;

  const drawWidth = usableWidth;
  const drawHeight = imgHeight * scale;

  // 4️⃣ Page height = image height + margins
  const pageHeight = drawHeight + MARGIN * 2;

  const page = pdfDoc.addPage([A4_WIDTH, pageHeight]);

  // 5️⃣ Draw image (full-width, natural height)
  page.drawImage(image, {
    x: MARGIN,
    y: MARGIN,
    width: drawWidth,
    height: drawHeight
  });

  return await pdfDoc.save();
}

module.exports = imageToPdf;
