'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const UserRepository = require('../repository/UserRepository');
const UserRoleRepository = require('../repository/UserRoleRepository');
const { generateToken } = require('../security/JwtService');

module.exports = {
  async login(email, password) {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw { status: 401, message: 'Invalid email or password' };
    const valid = await bcrypt.compare(password, user.password);
    if (password != user.password) throw { status: 401, message: 'Invalid email or password' };
    const token = generateToken(user.email);
    const primaryRole = (user.roles && user.roles[0]) || null;
    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || null,
        role: primaryRole ? primaryRole.role : null,
        branchId: primaryRole ? primaryRole.branchId : null,
        branch: primaryRole && primaryRole.branch ? primaryRole.branch.name : null,
      },
    };
  },

  async getAllUsers() {
    return UserRepository.findAll();
  },

  async getUserById(id) {
    const user = await UserRepository.findById(id);
    if (!user) throw { status: 404, message: 'User not found' };
    return user;
  },

  async getUserByEmail(email) {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw { status: 404, message: 'User not found' };
    return user;
  },

  async getUsersByRole(role) {
    return UserRepository.findByRole(role);
  },

  async getUsersByBranch(branchId) {
    return UserRepository.findByBranch(branchId);
  },

  async getPaginatedUsers({ page = 0, size = 10, sortBy = 'created_at', sortDir = 'desc', name, email, role, branchId }) {
    const { count, rows } = await UserRepository.findPaginated({ page, size, sortBy, sortDir, name, email, role, branchId });
    return {
      content: rows,
      pageNumber: page,
      pageSize: size,
      totalElements: count,
      totalPages: Math.ceil(count / size),
      last: (page + 1) * size >= count,
    };
  },

  async createUser({ fullName, email, phone, password, role, branchId }) {
    const existing = await UserRepository.findByEmail(email);
    if (existing) throw { status: 409, message: 'Email already in use' };
    const hash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const user = await UserRepository.create({ id: userId, fullName, email, phone, password: hash });
    if (role) {
      await UserRoleRepository.create({ id: uuidv4(), userId: user.id, role, branchId: branchId || null });
    }
    return UserRepository.findById(user.id);
  },

  async updateUser(id, data) {
    const user = await UserRepository.findById(id);
    if (!user) throw { status: 404, message: 'User not found' };
    const update = {};
    if (data.fullName) update.fullName = data.fullName;
    if (data.phone !== undefined) update.phone = data.phone;
    if (data.password) update.password = await bcrypt.hash(data.password, 12);
    await UserRepository.update(id, update);
    if (data.role) {
      await UserRoleRepository.deleteByUserId(id);
      await UserRoleRepository.create({ id: uuidv4(), userId: id, role: data.role, branchId: data.branchId || null });
    }
    return UserRepository.findById(id);
  },

  async setPin(id, pin) {
    const user = await UserRepository.findById(id);
    if (!user) throw { status: 404, message: 'User not found' };
    const hashedPin = await bcrypt.hash(pin, 12);
    await UserRepository.update(id, { pin: hashedPin });
    return { message: 'PIN set successfully' };
  },

  async verifyPin(id, pin) {
    const user = await UserRepository.findById(id);
    if (!user) throw { status: 404, message: 'User not found' };
    if (!user.pin) return { verified: false };
    const match = await bcrypt.compare(pin, user.pin);
    return { verified: match };
  },
  async verifyManagerPin(email, pin) {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw { status: 401, message: 'Invalid credentials' };
    const role = user.roles && user.roles[0] ? user.roles[0].role : null;
    if (!role || !['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(role)) {
      throw { status: 403, message: 'User does not have manager-level access' };
    }
    if (!user.pin) throw { status: 400, message: 'Manager has no PIN set' };
    const match = await bcrypt.compare(pin, user.pin);
    if (!match) throw { status: 401, message: 'Invalid PIN' };
    return { verified: true, role, userId: user.id };
  },


  async hasPin(id) {
    const user = await UserRepository.findById(id);
    if (!user) throw { status: 404, message: 'User not found' };
    return { hasPin: !!user.pin };
  },
};
