// utils/qrCode.js
const QRCode = require('qrcode');

// Generates a PNG QR code image as a Buffer, encoding the ticket's
// verify code — scanning it should give back something identifying
// that exact ticket.
function generateQrCodeBuffer(data) {
  return QRCode.toBuffer(data, {
    type: 'png',
    width: 300,
    margin: 2,
  });
}

module.exports = { generateQrCodeBuffer };