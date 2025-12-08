'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PricingRules', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      category: {
        type: Sequelize.ENUM('Base', 'Commission', 'Tax', 'Penalty', 'Timings'),
        allowNull: false,
      },
      scope: {
        type: Sequelize.ENUM('Global', 'State', 'City'),
        allowNull: false,
        defaultValue: 'Global',
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      vehicleType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      baseRate: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      perUnit: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      amount: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      perRides: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      value: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      taxType: {
        type: Sequelize.ENUM('Percentage', 'Fixed'),
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM('Driver', 'Customer', 'CampOwner'),
        allowNull: true,
      },
      cancelLimit: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      penaltyAmount: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      acceptTime: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PricingRules');
  }
};
