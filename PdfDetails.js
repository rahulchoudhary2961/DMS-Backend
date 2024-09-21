import { DataTypes } from 'sequelize';
import sequelize from './database.js'; // Adjust the path to your Sequelize instance

const PdfDetails = sequelize.define('PdfDetails', {
  pdf: {
    type: DataTypes.STRING,
    allowNull: true // Allow null if no value is required
  },
  docName: {
    type: DataTypes.STRING,
    allowNull: true // Allow null if no value is required
  },
  docNumber: {
    type: DataTypes.STRING,
    allowNull: true // Allow null if no value is required
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true // Allow null if no value is required
  },
  remarks: {
    type: DataTypes.STRING,
    defaultValue: ""
  },
  version: {
    type: DataTypes.STRING,
    defaultValue: "01"
  },
  accessControl: {
    type: DataTypes.ENUM('public', 'private'),
    defaultValue: 'public'
  }
}, {
  tableName: 'PdfDetails', // This will specify the table name in the database
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

export default PdfDetails;



// import mongoose from "mongoose";

// const PdfDetailsSchema = new mongoose.Schema(
//   {
//     pdf: String,
//     docName: String,
//     docNumber: String,
//     department: String,
//     remarks: {
//       type: String,
//       default: "",
//     },
//     version: {
//       type: String,
//       default: "01",
//     },
//     accessControl: {
//       type: String,
//       enum: ["public", "private"],
//       default: "public",
//     },
//   },
//   { collection: "PdfDetails", timestamps: true }
// );

// const PdfDetails = mongoose.model("PdfDetails", PdfDetailsSchema);

// export default PdfDetails;
