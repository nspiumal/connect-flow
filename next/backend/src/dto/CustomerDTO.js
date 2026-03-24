'use strict';
class CustomerDTO {
  constructor(customer) {
    this.id = customer.id;
    this.fullName = customer.fullName;
    this.nic = customer.nic;
    this.phone = customer.phone;
    this.address = customer.address;
    this.gender = customer.gender;
    this.customerType = customer.customerType;
    this.isActive = customer.isActive;
    this.createdAt = customer.created_at || customer.createdAt;
    this.updatedAt = customer.updated_at || customer.updatedAt;
  }
}
module.exports = CustomerDTO;
