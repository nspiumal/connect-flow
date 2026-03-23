'use strict';
const path = require('path');
const fs = require('fs');
const { uploadDir } = require('../service/ImageUploadService');

module.exports = {
  serveImage(req, res) {
    const filename = req.params.filename;
    if (!filename || filename.includes('..')) {
      return res.status(400).json({ message: 'Invalid filename' });
    }
    const filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Image not found' });
    }
    res.sendFile(filePath);
  },
};
