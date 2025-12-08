'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Manually delete the record for the corrupted migration from the SequelizeMeta table
    await queryInterface.sequelize.query(
      "DELETE FROM `SequelizeMeta` WHERE name = '20251205000000-update-users-table.js'"
    );
  },

  async down (queryInterface, Sequelize) {
    // This is a one-way corrective action. No down action is necessary.
    return Promise.resolve();
  }
};