const XLSX = require('xlsx');
const puppeteer = require('puppeteer');

module.exports = async function excelToPdf(fileBuffer) {
  // 1️⃣ Read Excel from BUFFER (FIX)
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (!data.length) {
    throw new Error("Excel sheet is empty");
  }

  // 2️⃣ Excel → HTML
  let html = `
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th, td {
          border: 1px solid black;
          padding: 6px;
          font-size: 9px;
          word-break: break-word;
        }
        th { background: #f0f0f0; }
      </style>
    </head>
    <body>
      <table>
        <tr>
  `;

  Object.keys(data[0]).forEach(h => {
    html += `<th>${h}</th>`;
  });

  html += `</tr>`;

  data.forEach(row => {
    html += `<tr>`;
    Object.values(row).forEach(v => {
      html += `<td>${v}</td>`;
    });
    html += `</tr>`;
  });

  html += `
      </table>
    </body>
  </html>
  `;

  // 3️⃣ HTML → PDF
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    landscape: true,
    printBackground: true,
    scale: 0.8
  });

  await browser.close();

  return pdfBuffer;
};
