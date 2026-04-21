const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const fontkit = require('@pdf-lib/fontkit');
const { PDFDocument, rgb, PDFName } = require('pdf-lib');

const normalizeToPDF = require('./utils/normalizeToPDF');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// ✅ MEMORY STORAGE (NO DISK)
const upload = multer({
storage: multer.memoryStorage(),
limits: { fileSize: 10 * 1024 * 1024 }
});

app.post('/upload', upload.array('files'), async (req, res) => {
const files = req.files || [];

try {
// ===== CLEAN INPUT =====
const cleanNoSpace = t => (t || "").trim().replace(/\s+/g, '');
const cleanSingleSpace = t => (t || "").trim().replace(/\s+/g, ' ');
const cleanFileName = t => (t || "").replace(/[^a-zA-Z0-9]/g, "_");


const subjectName = cleanSingleSpace(req.body.subjectName);
const subjectCode = cleanNoSpace(req.body.subjectCode).toUpperCase();
const semester = cleanNoSpace(req.body.semester);
const facultyName = cleanSingleSpace(req.body.facultyName);

const finalFileName =
  `${cleanFileName(subjectName)}_` +
  `${cleanFileName(subjectCode)}_` +
  `${cleanFileName(semester)}_` +
  `${cleanFileName(facultyName)}.pdf`;

// ===== CREATE PDF =====
const mergedPdf = await PDFDocument.create();
mergedPdf.registerFontkit(fontkit);

const regularFont = await mergedPdf.embedFont(
  fs.readFileSync(path.join(__dirname, 'fonts/Roboto-Regular.ttf'))
);

const boldFont = await mergedPdf.embedFont(
  fs.readFileSync(path.join(__dirname, 'fonts/Roboto-Bold.ttf'))
);

const labels = Array.isArray(req.body.labels)
  ? req.body.labels
  : req.body.labels
  ? [req.body.labels]
  : [];

let courseAttainmentLink = req.body.courseAttainmentLink || "";
if (Array.isArray(courseAttainmentLink)) {
  courseAttainmentLink = courseAttainmentLink[0];
}
courseAttainmentLink = courseAttainmentLink.trim();

let filePointer = 0;

// ===== TOC PAGE =====
const tocPage = mergedPdf.addPage();
const { width, height } = tocPage.getSize();

let currentPage = 1;
let indexData = [];

// ===== PROCESS FILES =====
for (let i = 0; i < labels.length; i++) {
  const label = labels[i];

  const isCourseAttainment =
    label.toLowerCase().includes("course attainment");

  const hasLink =
    isCourseAttainment && courseAttainmentLink !== "";

  let file = null;

  if (!isCourseAttainment && filePointer < files.length) {
    file = files[filePointer++];
  }

  if (!file && !hasLink) continue;

  let sectionStart = currentPage;

  // Course attainment page
  if (hasLink) {
    const linkPage = mergedPdf.addPage();

    linkPage.drawText(label.toUpperCase(), {
      x: (width - boldFont.widthOfTextAtSize(label.toUpperCase(), 18)) / 2,
      y: height - 40,
      size: 18,
      font: boldFont
    });

    linkPage.drawText("Excel Sheet Link:", {
      x: 60,
      y: height - 100,
      size: 14,
      font: boldFont
    });

    linkPage.drawText(courseAttainmentLink, {
      x: 60,
      y: height - 130,
      size: 10,
      font: regularFont,
      color: rgb(0, 0, 1),
      link: courseAttainmentLink
    });

    currentPage++;
  }

  // ===== PROCESS FILE =====
  if (file) {
    const fileBuffer = file.buffer;

    let pdfBytes;

    if (file.mimetype === 'application/pdf') {
      pdfBytes = fileBuffer;
    } else {
      pdfBytes = await normalizeToPDF({
        mimetype: file.mimetype,
        buffer: fileBuffer
      });
    }

    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

    copiedPages.forEach(p => mergedPdf.addPage(p));

    currentPage += copiedPages.length;
  }

  indexData.push({
    title: label,
    start: sectionStart,
    end: currentPage - 1
  });
}

// ===== DRAW TOC =====
const pages = mergedPdf.getPages();

let y = height - 100;
const startX = 60;
const rowHeight = 28;
const col1Width = 60;
const col2Width = 330;
const col3Width = 120;
const tableWidth = col1Width + col2Width + col3Width;

tocPage.drawText("TABLE OF CONTENTS", {
  x: (width - boldFont.widthOfTextAtSize("TABLE OF CONTENTS", 22)) / 2,
  y,
  size: 22,
  font: boldFont
});

y -= 60;

function drawRowLines(yPos) {
  tocPage.drawLine({
    start: { x: startX, y: yPos },
    end: { x: startX + tableWidth, y: yPos },
    thickness: 1
  });

  tocPage.drawLine({
    start: { x: startX, y: yPos - rowHeight },
    end: { x: startX + tableWidth, y: yPos - rowHeight },
    thickness: 1
  });

  [0, col1Width, col1Width + col2Width, tableWidth].forEach(offset => {
    tocPage.drawLine({
      start: { x: startX + offset, y: yPos },
      end: { x: startX + offset, y: yPos - rowHeight },
      thickness: 1
    });
  });
}

y -= rowHeight;

indexData.forEach((item, idx) => {
  drawRowLines(y);

  const rowTop = y;
  const rowBottom = y - rowHeight;

  tocPage.drawText(String(idx + 1), {
    x: startX + 10,
    y: y - 18,
    size: 12,
    font: regularFont
  });

  tocPage.drawText(item.title, {
    x: startX + col1Width + 10,
    y: y - 18,
    size: 12,
    font: regularFont
  });

  tocPage.drawText(`Pages ${item.start} - ${item.end}`, {
    x: startX + col1Width + col2Width + 10,
    y: y - 18,
    size: 12,
    font: regularFont
  });

  const targetPage = pages[item.start];

  const link = mergedPdf.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [startX, rowBottom, startX + tableWidth, rowTop],
    Border: [0, 0, 0],
    A: {
      Type: 'Action',
      S: 'GoTo',
      D: [targetPage.ref, 'Fit']
    }
  });

  const existingAnnots =
    tocPage.node.lookup(PDFName.of('Annots')) ||
    mergedPdf.context.obj([]);

  const annotsArray = existingAnnots.asArray
    ? existingAnnots.asArray()
    : [];

  annotsArray.push(link);

  tocPage.node.set(
    PDFName.of('Annots'),
    mergedPdf.context.obj(annotsArray)
  );

  y -= rowHeight;
});

// ===== PAGE NUMBERS =====
const totalPages = pages.length - 1;

for (let i = 1; i < pages.length; i++) {
  const page = pages[i];
  const text = `Page ${i} of ${totalPages}`;

  page.drawText(text, {
    x: (width - regularFont.widthOfTextAtSize(text, 10)) / 2,
    y: 40,
    size: 10,
    font: regularFont
  });
}

const finalPdfBytes = await mergedPdf.save();

// ✅ SEND DIRECTLY (NO FILE SYSTEM)
res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', `attachment; filename=${finalFileName}`);
res.send(Buffer.from(finalPdfBytes));


} catch (err) {
console.error("ERROR:", err);
res.status(500).send("Error while merging files.");
}
});

// ERROR HANDLER
app.use((err, req, res, next) => {
if (err instanceof multer.MulterError) {
return res.status(400).send("File too large");
}
res.status(500).send("Something went wrong");
});

// START SERVER
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});
