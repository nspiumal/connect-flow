'use strict';
class CreateUserRequest {
  constructor({ fullName, email, phone, password, role, branchId }) {
    this.fullName = fullName;
    this.email = email;
    this.phone = phone;
    this.password = password;
    this.role = role;
    this.branchId = branchId;
  }
}
module.exports = CreateUserRequest;
