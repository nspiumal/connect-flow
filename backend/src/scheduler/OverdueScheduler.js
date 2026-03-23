'use strict';
const cron = require('node-cron');
const { PawnTransaction } = require('../model');
const { Op } = require('sequelize');
require('dotenv').config();

const cronExpression = process.env.SCHEDULER_CRON || '0 2 * * *';

function startOverdueScheduler() {
  cron.schedule(cronExpression, async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [count] = await PawnTransaction.update(
        { status: 'Overdue' },
        {
          where: {
            status: 'Active',
            maturityDate: { [Op.lt]: today },
          },
        }
      );
      console.log(`[OverdueScheduler] Marked ${count} transactions as Overdue for ${today}`);
    } catch (err) {
      console.error('[OverdueScheduler] Error marking overdue transactions:', err.message);
    }
  });
  console.log(`[OverdueScheduler] Scheduled with cron: "${cronExpression}"`);
}

module.exports = { startOverdueScheduler };
