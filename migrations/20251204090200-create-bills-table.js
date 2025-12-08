'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Bills', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      rideId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Rides', // Table name
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // If the ride is deleted, the bill is deleted
        unique: true, // Only one bill per ride
      },
      baseFare: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      distanceFare: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      timeFare: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      platformFee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      taxes: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      penalty: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      discount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      driverEarnings: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
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
    await queryInterface.dropTable('Bills');
  }
};
