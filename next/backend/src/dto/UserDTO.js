'use strict';
class UserDTO {
  constructor(user, roles = []) {
    this.id = user.id;
    this.fullName = user.fullName;
    this.email = user.email;
    this.phone = user.phone;
    this.roles = roles;
    this.createdAt = user.created_at || user.createdAt;
    this.updatedAt = user.updated_at || user.updatedAt;
  }
}
module.exports = UserDTO;
