'use strict';
const { v4: uuidv4 } = require('uuid');
const InterestRateRepository = require('../repository/InterestRateRepository');

module.exports = {
  async getAll() {
    return InterestRateRepository.findAll();
  },
  async getActive() {
    return InterestRateRepository.findAllActive();
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
    const r = await InterestRateRepository.findById(id);
    if (!r) throw { status: 404, message: 'Interest rate not found' };
    await InterestRateRepository.update(id, data);
    return InterestRateRepository.findById(id);
  },
  /**
   * Toggle isActive on a rate.
   * If deactivating the current default, promote replacementDefaultRateId as the new default.
   */
  async toggleActive(id, replacementDefaultRateId) {
    const r = await InterestRateRepository.findById(id);
    if (!r) throw { status: 404, message: 'Interest rate not found' };

    const nowActive = !r.isActive;

    if (!nowActive && r.isDefault) {
      // Deactivating the default — a replacement must be supplied
      if (!replacementDefaultRateId) {
        throw { status: 400, message: 'A replacement default rate must be selected before deactivating the current default.' };
      }
      const replacement = await InterestRateRepository.findById(replacementDefaultRateId);
      if (!replacement || !replacement.isActive) {
        throw { status: 400, message: 'Replacement rate not found or not active.' };
      }
      // Promote replacement, then deactivate current
      await InterestRateRepository.update(replacementDefaultRateId, { isDefault: true });
      await InterestRateRepository.update(id, { isActive: false, isDefault: false });
    } else {
      await InterestRateRepository.update(id, { isActive: nowActive });
    }

    return InterestRateRepository.findById(id);
  },
  async delete(id) {
    await InterestRateRepository.delete(id);
  },
};
