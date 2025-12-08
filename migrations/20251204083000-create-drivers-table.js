'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Drivers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'Users', // Name of the target table
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      driverLicenseNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      driverLicensePhotoUrl: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      vehicleModel: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      vehicleNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      vehicleType: {
        type: Sequelize.ENUM('Bike', 'Auto', 'Car', 'Car 6-Seater'),
        allowNull: false,
      },
      rcPhotoUrl: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      isApproved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      rating: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 5.00,
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
    await queryInterface.dropTable('Drivers');
  }
};
