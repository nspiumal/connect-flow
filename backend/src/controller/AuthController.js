'use strict';
const UserService = require('../service/UserService');

module.exports = {
  async login(req, res) {
    try {
      console.log("Login attempt - Email:", req.body.email);
      const { email, password } = req.body;
      if (!email || !password) {
        console.log("Missing email or password");
        return res.status(400).json({ message: 'Email and password are required' });
      }
      const result = await UserService.login(email, password);
      console.log("Login successful for:", email);
      res.json(result);
    } catch (err) {
      console.log("Login failed for:", req.body.email, "Error:", err.message);
      res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
    }
  },

  async me(req, res) {
    try {
      res.json(await UserService.getMe(req.userEmail));
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
    }
  },
};
