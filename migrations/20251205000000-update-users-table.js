'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('Users');

    if (tableDefinition.name && !tableDefinition.firstName) {
      await queryInterface.renameColumn('Users', 'name', 'firstName');
    }

    const columnsToAdd = {
        firstName: { type: Sequelize.STRING, allowNull: false, defaultValue: 'User' },
        lastName: { type: Sequelize.STRING, allowNull: false, defaultValue: 'User' },
        city: { type: Sequelize.STRING, allowNull: true },
        state: { type: Sequelize.STRING, allowNull: true },
        pfp: { type: Sequelize.STRING, allowNull: true },
        isOnline: { type: Sequelize.BOOLEAN, defaultValue: false },
        isBlocked: { type: Sequelize.BOOLEAN, defaultValue: false },
        walletBalance: { type: Sequelize.FLOAT, defaultValue: 0 },
        lowBalanceSince: { type: Sequelize.DATE, allowNull: true },
        driverPicUrl: { type: Sequelize.STRING, allowNull: true },
        licenseUrl: { type: Sequelize.STRING, allowNull: true },
        rcUrl: { type: Sequelize.STRING, allowNull: true },
        averageRating: { type: Sequelize.FLOAT, defaultValue: 0 },
        outstandingPlatformFee: { type: Sequelize.FLOAT, defaultValue: 0 },
        currentLat: { type: Sequelize.FLOAT, allowNull: true },
        currentLng: { type: Sequelize.FLOAT, allowNull: true },
    };

    for (const columnName in columnsToAdd) {
        if (!tableDefinition[columnName]) {
            await queryInterface.addColumn('Users', columnName, columnsToAdd[columnName]);
        }
    }

    if (tableDefinition.mobile && !tableDefinition.phoneNumber) {
        await queryInterface.renameColumn('Users', 'mobile', 'phoneNumber');
    } else if (!tableDefinition.phoneNumber) {
        await queryInterface.addColumn('Users', 'phoneNumber', { 
            type: Sequelize.STRING, 
            allowNull: false, 
            unique: true, 
            defaultValue: Sequelize.literal(`CONCAT('temp_', UUID())`) 
        });
    }

    if (tableDefinition.role && !tableDefinition.userType) {
        await queryInterface.renameColumn('Users', 'role', 'userType');
    } else if (!tableDefinition.userType) {
        await queryInterface.addColumn('Users', 'userType', { 
            type: Sequelize.ENUM('Customer', 'Driver', 'Admin'), 
            defaultValue: 'Customer' 
        });
    }
  },

  async down(queryInterface, Sequelize) {
    return Promise.resolve();
  }
};