import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directories exist
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');
const EVENTS_DIR = path.join(UPLOADS_DIR, 'events');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');

[UPLOADS_DIR, EVENTS_DIR, VIDEOS_DIR, AVATARS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Allowed media MIME types
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'
]);

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-matroska'
]);

const EXTENSION_MAP = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/ogg': '.ogv',
  'video/quicktime': '.mov',
  'video/x-matroska': '.mkv'
};

// POST /api/upload - Direct base64 or binary media upload
router.post('/', verifyToken, async (req, res) => {
  try {
    const { base64Data, filename, mediaType, folder = 'events' } = req.body || {};

    if (!base64Data) {
      return res.status(400).json({ success: false, message: 'No media data provided for upload.' });
    }

    // Extract MIME type and raw buffer
    let mimeType = 'image/jpeg';
    let base64Clean = base64Data;

    const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-+.]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1].toLowerCase();
      base64Clean = matches[2];
    }

    const isImage = ALLOWED_IMAGE_TYPES.has(mimeType);
    const isVideo = ALLOWED_VIDEO_TYPES.has(mimeType);

    if (!isImage && !isVideo) {
      return res.status(400).json({
        success: false,
        message: `Unsupported file type: ${mimeType}. Allowed formats: JPG, PNG, WEBP, GIF, SVG, MP4, WEBM, MOV.`
      });
    }

    const buffer = Buffer.from(base64Clean, 'base64');
    const maxSize = isVideo ? 100 * 1024 * 1024 : 15 * 1024 * 1024; // 100MB video, 15MB image

    if (buffer.length > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File exceeds maximum allowed size (${isVideo ? '100MB for video' : '15MB for image'}).`
      });
    }

    const ext = EXTENSION_MAP[mimeType] || (isVideo ? '.mp4' : '.jpg');
    const safeHash = crypto.randomBytes(12).toString('hex');
    const safeName = `${Date.now()}-${safeHash}${ext}`;

    const targetSubDir = isVideo ? VIDEOS_DIR : (folder === 'avatars' ? AVATARS_DIR : EVENTS_DIR);
    const targetPath = path.join(targetSubDir, safeName);

    fs.writeFileSync(targetPath, buffer);

    const relativeSub = isVideo ? 'videos' : (folder === 'avatars' ? 'avatars' : 'events');
    const publicUrl = `/uploads/${relativeSub}/${safeName}`;

    return res.status(201).json({
      success: true,
      message: 'Media uploaded successfully!',
      url: publicUrl,
      type: isVideo ? 'video' : 'image',
      mimeType,
      size: buffer.length,
      filename: filename || safeName
    });
  } catch (error) {
    console.error('[Upload Error]:', error);
    return res.status(500).json({ success: false, message: 'Server error during media upload.' });
  }
});

export default router;
