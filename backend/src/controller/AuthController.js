'use strict';
const UserService = require('../service/UserService');

module.exports = {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
      const result = await UserService.login(email, password);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
    }
  },
};
