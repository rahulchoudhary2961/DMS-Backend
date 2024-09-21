// Notification.js
import { DataTypes } from 'sequelize';
import sequelize from './database.js'; // Adjust the path to your sequelize instance

const Notifications = sequelize.define('Notifications', {
  message: {
    type: DataTypes.STRING,
    allowNull: false
  },
  recipientsGroup: {
    type: DataTypes.ENUM('Admin', 'Trainee', 'Intern', 'Defense', 'GeoInformatics'),
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'Notifications',
  timestamps: true
});

export default Notifications;
