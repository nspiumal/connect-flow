'use strict';
// LoginRequest DTO - validates login payload
class LoginRequest {
  constructor({ email, password }) {
    this.email = email;
    this.password = password;
  }
  validate() {
    if (!this.email) throw new Error('Email is required');
    if (!this.password) throw new Error('Password is required');
  }
}
module.exports = LoginRequest;
