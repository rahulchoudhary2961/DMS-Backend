// Import necessary modules
import { DataTypes } from 'sequelize';
import sequelize from './database.js'; // Adjust the path to your Sequelize instance
import UserInfo from './userDetails.js'; // Adjust the path to your UserInfo model
import PdfDetails from './PdfDetails.js'; // Adjust the path to your PdfDetails model

// Define the Request model
const Request = sequelize.define('Request', {
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: UserInfo, // Refers to the UserInfo model
      key: 'id'
    },
    allowNull: false
  },
  documentId: {
    type: DataTypes.INTEGER,
    references: {
      model: PdfDetails, // Refers to the PdfDetails model
      key: 'id'
    },
    allowNull: false
  },
  content: {
    type: DataTypes.STRING,
    allowNull: true // Allow null if no value is required
  },
  requestStatus: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending'
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    references: {
      model: UserInfo, // Refers to the UserInfo model
      key: 'id'
    },
    allowNull: true // Allow null if no value is required
  }
}, {
  tableName: 'Requests', // Specify the table name
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Define associations
Request.belongsTo(UserInfo, { foreignKey: 'userId', as: 'user' });
Request.belongsTo(PdfDetails, { foreignKey: 'documentId', as: 'document' });
Request.belongsTo(UserInfo, { foreignKey: 'updatedBy', as: 'updater' });

export default Request;



// import { Schema, model } from "mongoose";
// import UserInfo from "./userDetails.js";

// const requestSchema = new Schema(
//   {
//     userId: {
//       type: Schema.Types.ObjectId,
//       ref: "UserInfo",
//     },
//     documentId: {
//       type: Schema.Types.ObjectId,
//       ref: "PdfDetails",
//     },
//     content: String,
//     requestStatus: {
//       type: String,
//       enum: ["Pending", "Approved", "Rejected"],
//       default: "Pending",
//     },
//     updatedBy: {
//       type: Schema.Types.ObjectId,
//       ref: "UserInfo",
//     },
//   },
//   { timestamps: true }
// );

// export default model("Request", requestSchema);
