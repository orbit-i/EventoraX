// utils/idCardGenerator.js
const PDFDocument = require('pdfkit');

function generateIdCardPdf({ attendeeName, eventName, attendeeEmail, idCardId }) {
  return new Promise((resolve, reject) => {
    // ID cards are small — using a compact custom page size instead of A4
    const doc = new PDFDocument({ size: [242, 153], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
     // ~ credit-card 
    //ratio
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.rect(0, 0, 242, 153).fill('#14213D');
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(14).text('EVENTORAX', 15, 12);
    doc.fontSize(10).font('Helvetica').text(eventName, 15, 32, { width: 210 });
    doc.fontSize(13).font('Helvetica-Bold').text(attendeeName, 15, 70, { width: 210 });
    doc.fontSize(8).font('Helvetica').text(attendeeEmail, 15, 90, { width: 210 });
    doc.fontSize(7).fillColor('#B8892D').text(`ID: ${idCardId}`, 15, 130);

    doc.end();
  });
}

module.exports = { generateIdCardPdf };