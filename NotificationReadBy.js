import { DataTypes } from 'sequelize';
import sequelize from './database.js'; // Adjust the path to your sequelize instance

const NotificationReadBy = sequelize.define('NotificationReadBy', {
  notificationId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Notifications',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  userInfoId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'UserInfo',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'NotificationReadBy',
  timestamps: false
});

export default NotificationReadBy;
