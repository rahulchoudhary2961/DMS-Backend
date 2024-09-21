import Notification from './notifications.js';
import UserInfo from './userDetails.js';
import NotificationRecipients from './NotificationRecipients.js';
import NotificationReadBy from './NotificationReadBy.js';

// Define many-to-many relationships
Notification.belongsToMany(UserInfo, {
  through: NotificationRecipients,
  as: 'recipients',
  foreignKey: 'notificationId',
  otherKey: 'userInfoId'
});

Notification.belongsToMany(UserInfo, {
  through: NotificationReadBy,
  as: 'readBy',
  foreignKey: 'notificationId',
  otherKey: 'userInfoId'
});

UserInfo.belongsToMany(Notification, {
  through: NotificationRecipients,
  as: 'notificationsReceived',
  foreignKey: 'userInfoId',
  otherKey: 'notificationId'
});

UserInfo.belongsToMany(Notification, {
  through: NotificationReadBy,
  as: 'notificationsRead',
  foreignKey: 'userInfoId',
  otherKey: 'notificationId'
});
