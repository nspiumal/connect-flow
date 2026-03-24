'use strict';
const path = require('path');
const { upload, uploadDir } = require('../service/ImageUploadService');

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
        res.status(500).json({ message: e.message });
      }
    },
  ],
};
