'use strict';
const path = require('path');
const fs = require('fs');
const { uploadDir } = require('../service/ImageUploadService');

module.exports = {
  serveImage(req, res) {
    const filename = req.params.filename;
    if (!filename) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    // Resolve and verify the path stays within the allowed directory
    const resolvedPath = path.resolve(uploadDir, filename);
    const resolvedBase = path.resolve(uploadDir);
    if (!resolvedPath.startsWith(resolvedBase + path.sep) && resolvedPath !== resolvedBase) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ message: 'Image not found' });
    }
    res.sendFile(resolvedPath);
  },
};
