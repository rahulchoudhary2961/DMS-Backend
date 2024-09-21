// Import Sequelize and your database instance
import { DataTypes } from 'sequelize';
import sequelize from './database.js'; // Adjust the path to where your 

const User = sequelize.define('UserInfo', {
  fname: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lname: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other')
  },
  department: {
    type: DataTypes.STRING
  },
  phone: {
    type: DataTypes.CHAR(10)
  },
  profilePicture: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  isLoggedIn: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'UserInfo', // This will prevent Sequelize from pluralizing the table name
  timestamps: true
});

export default User