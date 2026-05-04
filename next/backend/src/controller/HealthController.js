'use strict';

module.exports = {
  health(req, res) {
    res.json({ status: 'UP', timestamp: new Date().toISOString(), service: 'Connect Flow API' });
  },
  info(req, res) {
    res.json({ status: 'UP', timestamp: new Date().toISOString(), service: 'Connect Flow API', version: '1.0.0', environment: process.env.NODE_ENV || 'development' });
  },
};
