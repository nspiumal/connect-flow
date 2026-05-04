'use strict';
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dlosh8aj8',
  api_key: process.env.CLOUDINARY_API_KEY || '183814421138428',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'XzKs7TvPNwg_cQJVAO5dFo3uw94'
});

module.exports = {
  async uploadBase64(base64Image) {
    if (!base64Image) return null;
    if (base64Image.startsWith('http')) return base64Image;

    try {
      const result = await cloudinary.uploader.upload(base64Image, {
        folder: 'pawn_transactions'
      });
      return result.secure_url;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      return base64Image;
    }
  },

  async getBase64FromUrl(url) {
    if (!url) return null;
    if (url.startsWith('data:image')) return url;

    return new Promise((resolve) => {
      const https = require('https');
      https.get(url, (res) => {
        if (res.statusCode !== 200) {
          resolve(url);
          return;
        }

        const data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(data);
          const contentType = res.headers['content-type'] || 'image/jpeg';
          resolve(`data:${contentType};base64,${buffer.toString('base64')}`);
        });
      }).on('error', (err) => {
        console.error('Cloudinary fetch error:', err);
        resolve(url);
      });
    });
  }
};
