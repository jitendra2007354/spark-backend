'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Rides', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users', // Table name
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      driverId: {
        type: Sequelize.INTEGER,
        allowNull: true, // Can be null until a driver accepts
        references: {
          model: 'Drivers', // Table name
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // If driver is deleted, don't delete the ride history
      },
      pickupLocation: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      dropoffLocation: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      pickupAddress: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dropoffAddress: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      vehicleType: {
        type: Sequelize.ENUM('Bike', 'Auto', 'Car', 'Car 6-Seater'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'ongoing', 'completed', 'cancelled', 'expired'),
        defaultValue: 'pending',
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
    await queryInterface.dropTable('Rides');
  }
};
