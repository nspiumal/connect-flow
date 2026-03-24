'use strict';

module.exports = {
  health(req, res) {
    res.json({ status: 'UP', timestamp: new Date().toISOString(), service: 'Connect Flow API' });
  },
};
