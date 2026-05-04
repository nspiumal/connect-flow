'use strict';
const path = require('path');
const fs = require('fs');
const { upload, uploadDir } = require('../service/ImageUploadService');
const handleErr = require('../utils/handleErr');

module.exports = {
  upload: [
    upload.array('files', 10),
    (req, res) => {
      try {
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ message: 'No files uploaded' });
        }
        const urls = req.files.map((f) => `/api/images/serve/${f.filename}`);
        res.json({ urls, filenames: req.files.map((f) => f.filename) });
      } catch (e) {
        handleErr(res, e, 'ImageUpload');
      }
    },
  ],

  // POST /images/upload-multiple  — same multer handler, aliased
  uploadMultiple: [
    upload.array('files', 10),
    (req, res) => {
      try {
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ message: 'No files uploaded' });
        }
        const urls = req.files.map((f) => `/api/images/serve/${f.filename}`);
        res.json({ urls, filenames: req.files.map((f) => f.filename) });
      } catch (e) {
        handleErr(res, e, 'ImageUpload');
      }
    },
  ],

  // DELETE /images/delete?url=...
  deleteImage(req, res) {
    try {
      const { url } = req.query;
      if (!url) return res.status(400).json({ message: 'url query param required' });
      const filename = path.basename(url);
      const filepath = path.join(uploadDir, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return res.json({ message: 'Image deleted successfully' });
      }
      return res.status(404).json({ message: 'Image not found' });
    } catch (e) {
      handleErr(res, e, 'ImageUpload');
    }
  },
};
