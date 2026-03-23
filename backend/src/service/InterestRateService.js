'use strict';
const { v4: uuidv4 } = require('uuid');
const InterestRateRepository = require('../repository/InterestRateRepository');

module.exports = {
  async getAll() {
    return InterestRateRepository.findAll();
  },
  async getById(id) {
    const r = await InterestRateRepository.findById(id);
    if (!r) throw { status: 404, message: 'Interest rate not found' };
    return r;
  },
  async getDefault() {
    return InterestRateRepository.findDefault();
  },
  async create(data) {
    return InterestRateRepository.create({ id: uuidv4(), ...data });
  },
  async update(id, data) {
    await InterestRateRepository.findById(id).then((r) => { if (!r) throw { status: 404, message: 'Interest rate not found' }; });
    await InterestRateRepository.update(id, data);
    return InterestRateRepository.findById(id);
  },
  async delete(id) {
    await InterestRateRepository.delete(id);
  },
};
