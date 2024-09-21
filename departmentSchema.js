import { DataTypes } from 'sequelize';
import sequelize from './database.js'; // Adjust the path to your Sequelize instance

// Define the Department model
const Department = sequelize.define('Department', {
  name: {
    type: DataTypes.STRING,
    allowNull: false, // Equivalent to `required: true`
    unique: true // Ensures the name is unique
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false // Equivalent to `required: true`
  },
  manager: {
    type: DataTypes.STRING,
    allowNull: false // Equivalent to `required: true`
  }
}, {
  tableName: 'Departments', // Specifies the table name
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

export default Department;
