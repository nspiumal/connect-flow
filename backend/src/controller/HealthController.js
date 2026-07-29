'use strict';

module.exports = {
  health(req, res) {
    res.json({ status: 'UP', timestamp: new Date().toISOString(), service: 'Kalyani House of Jewellers API' });
  },
};
