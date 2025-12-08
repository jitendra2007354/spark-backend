'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Bids', {
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
        onDelete: 'CASCADE', // If ride is deleted, its bids are deleted
      },
      driverId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Drivers', // Table name
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // If driver is deleted, their bids are deleted
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      isAccepted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    // Add a unique index to prevent a driver from bidding on the same ride multiple times
    await queryInterface.addIndex('Bids', ['rideId', 'driverId'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Bids');
  }
};
