'use strict';
const { v4: uuidv4 } = require('uuid');
const InterestRateRepository = require('../repository/InterestRateRepository');
const { wrapWithLogging } = require('../utils/methodLogger');

const formatRate = (r) => {
  if (!r) return r;
  const obj = r.toJSON ? r.toJSON() : r;
  return {
    ...obj,
    ratePercent: Number(obj.ratePercent),
    firstMonthRatePercent: obj.firstMonthRatePercent != null ? Number(obj.firstMonthRatePercent) : null,
  };
};

const InterestRateService = {
  async getAll() {
    const rates = await InterestRateRepository.findAll();
    return rates.map(formatRate);
  },
  async getActive() {
    const rates = await InterestRateRepository.findActive();
    return rates.map(formatRate);
  },
  async getById(id) {
    const r = await InterestRateRepository.findById(id);
    if (!r) throw { status: 404, message: 'Interest rate not found' };
    return formatRate(r);
  },
  async getDefault() {
    return formatRate(await InterestRateRepository.findDefault());
  },
  async create(data) {
    return formatRate(await InterestRateRepository.create({ id: uuidv4(), ...data }));
  },
  async update(id, data) {
    await InterestRateRepository.findById(id).then((r) => { if (!r) throw { status: 404, message: 'Interest rate not found' }; });
    await InterestRateRepository.update(id, data);
    return formatRate(await InterestRateRepository.findById(id));
  },
  async toggleActive(id, replacementId) {
    const r = await InterestRateRepository.findById(id);
    if (!r) throw { status: 404, message: 'Interest rate not found' };
    if (r.isDefault && r.isActive && !replacementId) {
      throw { status: 400, message: 'Cannot deactivate default rate without replacement' };
    }
    // Simple toggle implementation. In a real app we might also set the replacement.
    await InterestRateRepository.update(id, { isActive: !r.isActive });
  },
  async delete(id) {
    await InterestRateRepository.delete(id);
  },
};

module.exports = wrapWithLogging('InterestRateService', InterestRateService);
