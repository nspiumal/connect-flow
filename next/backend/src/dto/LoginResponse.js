'use strict';
class LoginResponse {
  constructor({ token, email, fullName, roles }) {
    this.token = token;
    this.email = email;
    this.fullName = fullName;
    this.roles = roles;
  }
}
module.exports = LoginResponse;
