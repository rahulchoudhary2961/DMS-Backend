import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import otpGenerator from "otp-generator";
import Request from "./Requests.js";
import PdfDetails from "./PdfDetails.js";
import UserInfo from "./userDetails.js";
import Notifications from "./notifications.js";
import Department from "./departmentSchema.js";
import sequelize from "./database.js";
import './associationsTable.js';
import serverless from 'serverless-http';
const PORT = process.env.PORT || 3000;


dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;


const app = express();

//middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use("/files", express.static("files"));


// Create a connection object



// Close the connection

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./files");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});

// Controller and route functions for Forms
// Model and upload setup

const upload = multer({ storage: storage });

// Code for nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "rahulcraze98@gmail.com",
    pass: "oekd nfjw dywt kpga",
  },
});

// Endpoints for OTP Verification and Password change
let otpCache = {};

app.post("/sendOTP", (req, res) => {
  const { email } = req.body;
  const otp = otpGenerator.generate(4, {
    digits: true,
    alphabets: false,
    upperCase: false,
    specialChars: false,
  });

  const mailOptions = {
    from: "rahulcraze98@gmail.com",
    to: email,
    subject: "OTP Verification",
    text: `Your OTP for password change is ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      res.json({ success: false });
    } else {
      otpCache[email] = otp;
      res.json({ success: true });
    }
  });
});
console.log(otpCache);
app.post("/verifyOTP", (req, res) => {
  const { email, otp } = req.body;
  if (otp === otpCache[email]) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

app.post("/updatePassword", async (req, res) => {
  const { email, newPassword } = req.body;
  const encryptedPassword = await bcrypt.hash(newPassword, 10);

  try {
    const user = await UserInfo.findOne({ email });
    if (!user) {
      return res.json({ error: "User not found" });
    }

    // await UserInfo.updateOne({ email }, { password: encryptedPassword });
    await UserInfo.update({ password: encryptedPassword },
      { where: { email: email } }
    )

    res.json({ status: "ok" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST endpoint for file upload
app.post("/upload-files", upload.single("file"), async (req, res) => {
  const docName = req.body.docName;
  const docNumber = req.body.docNumber;
  const fileName = req.file.filename;
  const department = req.body.department;
  try {
    await PdfDetails.create({
      docName: docName,
      docNumber: docNumber,
      pdf: fileName,
      department: department,
    });
    res.send({ status: "ok" });
  } catch (error) {
    console.log("upload-files-error" , error);
    
    res.json({ status: "error", message: error.message });
  }
});

// GET endpoint to retrieve files
app.get("/get-files", async (req, res) => {
  try {
    // const data = await PdfDetails.find({});
    const data = await PdfDetails.findAll();
    res.send({ status: "ok", data: data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET endpoint for retriving public files for users
app.get("/get-public-files", async (req, res) => {
  try {
    // const publicData = await PdfDetails.find({ accessControl: "public" });
    const publicData = await PdfDetails.findAll({
      where: {
        accessControl: "public"
      }
    })
    res.send({ status: "ok", data: publicData });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET endpoint to retrieve a PDF by ID
app.get("/get-file/:id", async (req, res) => {
  const fileId = req.params.id;
  try {
    // const file = await PdfDetails.findById(fileId);
    const file = await PdfDetails.findByPk(fileId)
    
    if (!file) {
      return res
        .status(404)
        .json({ status: "error", message: "File not found" });
    }
    res.send({ status: "ok", data: file });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// DELETE endpoint to delete a file by ID
app.delete("/delete-file/:id", async (req, res) => {
  const fileId = req.params.id;

  try {
    // const file = await PdfDetails.findById(fileId);
    const file  = await PdfDetails.findByPk(fileId)    
    if (file) {
      // await PdfDetails.findByIdAndDelete(fileId)
      // await PdfDetails.findByIdAndDelete(fileId);
      const result = await PdfDetails.destroy({
        where: {
          id: fileId,
        },
      });      
      const filePath = `./files/${file.pdf}`;
      fs.unlinkSync(filePath); // Remove the file from storage
      // const updatedForms = await PdfDetails.find({});
      const updatedForms = await PdfDetails.findAll()
      res.send({ status: "ok", data: updatedForms });
    } else {
      res.status(404).json({ status: "File not found" });
    }
  } catch (error) {
    console.log("delete-file error" , error)
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Edit endpoint to update a file by ID
app.put("/update-file/:id", upload.single("file"), async (req, res) => {
  console.log("update-file/:id" , req.file);
  const fileId = req.params.id;
  const { docName, docNumber, department, remarks } = req.body;

  try {
    // Find the file by its ID
    // const fileToUpdate = await PdfDetails.findById(fileId);
   const fileToUpdate =  await PdfDetails.findByPk(fileId)
    if (!fileToUpdate) {
      return res.status(404).json({ status: "File not found" });
    }

    // Find the latest version number for the document
    // const latestVersionFile = await PdfDetails.findOne({
    //   docName,
    //   department,
    // }).sort({ version: -1 }); // Sort in descending order to get the latest version first

    const latestVersionFile = await PdfDetails.findAll({
      where: {
        docName: docName,
        department: department,
      },
      order: [['version', 'DESC']], // Sorting by version in descending order
      limit: 1 // Limit to the latest version
    });

    let nextVersion = "01"; // Default version if no previous versions found
    if (latestVersionFile) {
      const currentVersion = parseInt(latestVersionFile.version, 10);
      nextVersion = (currentVersion + 1).toString().padStart(2, "0");
    }

    // Create a new entry for the updated document
    const updatedFile = new PdfDetails({
      pdf: req.file.filename,
      docName,
      docNumber,
      department,
      remarks,
      version: nextVersion,
    });

    // Save the updated file to the database
    await updatedFile.save();

    // Fetch and return all forms
    // const updatedForms = await PdfDetails.find();
    const updatedForms = await PdfDetails.findAll()

    res.json({ status: "ok", data: updatedForms });
  } catch (error) {
    console.log("update-fileById" , error)
    res.status(500).json({ status: "error", message: error.message });
  }
});


// PUT endpoint for changing the access control
app.put("/access-control/:pdfId", async (req, res) => {
  const { pdfId } = req.params;
  const { accessControl } = req.body;
  try {
    // Find the PDF document by ID
    // const pdfDocument = await PdfDetails.findById(pdfId);
    const pdfDocument = await PdfDetails.findByPk(pdfId)

    if (!pdfDocument) {
      return res.status(404).json({ error: "PDF document not found" });
    }

    // Update the access control field
    pdfDocument.accessControl = accessControl;
    await pdfDocument.save();

    return res.json({
      message: "Access control updated successfully",
      pdfDocument,
    });
  } catch (error) {
    console.error("Error updating access control:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Show document information

// Default route
app.get("/", async (req, res) => {
  res.send("Success!!!!!!");
});



app.post("/register", async (req, res) => {
  const {
    fname,
    lname,
    email,
    password,
    userType,
    phone,
    department,
    gender,
    profilePicture,
  } = req.body;

  const encryptedPassword = await bcrypt.hash(password, 10);
  try {
    const oldUser = await UserInfo.findOne({where:{
      email:email
    }});    
    if (oldUser) {
      return res.json({ error: "User Exists" });
    }
    await UserInfo.create({
      fname,
      lname,
      email,
      password: encryptedPassword,
      userType,
      phone,
      department,
      gender,
      profilePicture,
    });
    const allUsers = await UserInfo.findAll();    
    res.json({ status: "ok", users: allUsers });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/login-user", async (req, res) => {
  const { email, password } = req.body;
  console.log("====", email, password);


  try {
    const [user] = await sequelize.query('SELECT * FROM UserInfo WHERE email = :email', {
      replacements: { email },
      type: sequelize.QueryTypes.SELECT
    })
    console.log("data", user);
    const userName = user.email;
    const password1 = user.password;

    if (!user) {
      return res.json({ error: "User Not found" });
    }
    console.log(password, userName);

    if (await bcrypt.compare(password, password1)) {
      const token = jwt.sign({ email: email }, JWT_SECRET, {
        expiresIn: "15m",
      });
      console.log(token);


      // Update isLoggedIn field to true for the logged-in user

      // const [results] = await sequelize.query(
      //   'UPDATE UserInfo SET isLoggedIn = TRUE WHERE email = :email',
      //   {
      //     replacements: { email },
      //     type: sequelize.QueryTypes.UPDATE
      //   }
      // );

      // // Check results structure      
      // const affectedRows = results ? results[0] : 0;
      // console.log(affectedRows);

      const [affectedRows] = await UserInfo.update(
        { isLoggedIn: true }, // Fields to update
        { where: { email } }  // Condition to match
      );

      console.log(affectedRows);  // Number of affected rows

      const [updatedUser] = await sequelize.query('SELECT * FROM UserInfo WHERE email = :email', {
        replacements: { email },
        type: sequelize.QueryTypes.SELECT
      })
      console.log("==== ", updatedUser);


      // Include user details and isLoggedIn value in the response
      return res.json({
        status: "ok",
        data: token,
        user: updatedUser,
        isLoggedIn: true,
      });
    } else {
      return res.json({ error: "Invalid Password" });
    }
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/log-out", async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by email
    const user = await UserInfo.findOne({ where:{
      email:email
    } });

    if (!user) {
      return res.json({ error: "User not found" });
    }

    // Update isLoggedIn field to false for the logged-out user
    await UserInfo.update({ isLoggedIn: false }, { where: { email } });


    return res.json({ status: "ok", message: "User logged out successfully" });
  } catch (error) {
    console.error("Error logging out user:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/userData", async (req, res) => {
  const { token } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    //console.log(user);
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }

    const useremail = user.email;
    User.findOne({ email: useremail })
      .then((data) => {
        res.send({ status: "ok", data: data });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      });
  } catch (error) { }
});

app.listen(5000, () => {
  console.log("Server Started");
});

app.get("/getAllUser", async (req, res) => {
  try {
    const allUser = await sequelize.query(
      'SELECT * FROM UserInfo',
      {
        type: sequelize.QueryTypes.SELECT
      }
    );
    res.send({ status: "ok", data: allUser });
  } catch (error) {
    console.log(error);
  }
});

app.post("/deleteUser", async (req, res) => {
  const { userid } = req.body;
  try {
    // UserInfo.deleteOne({ _id: userid }, function (err, res) {
    //   console.log(err);
    // });
    await sequelize.query(`DELETE FROM UserInfo WHERE id = ${userid}`)
    res.send({ status: "Ok", data: "Deleted" });
  } catch (error) {
    console.log(error);
  }
});

app.patch("/editUser/:id", async (req, res) => {
  const userId = req.params.id;
  const updatedUserData = req.body.updatedUserData;

  try {
    const [updatedCount] = await UserInfo.update(updatedUserData, {
      where: { id: userId },
      returning: true,
    });

    if (updatedCount === 0) {
      return res.status(404).send({ status: "Error", data: "User not found" });
    }

    // Fetch all users after the update
    const allUsers = await UserInfo.findAll();

    res.send({ status: "Ok", data: allUsers });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "Error", data: "Internal Server Error" });
  }
});


// Route for edit profile

app.put("/editProfile/:userId", async (req, res) => {
  const userId = req.params.userId;
  const { fname, lname, email, gender, department, phone } = req.body;

  try {
    const user = await UserInfo.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user details
    user.fname = fname || user.fname;
    user.lname = lname || user.lname;
    user.email = email || user.email;
    user.gender = gender || user.gender;
    user.department = department || user.department;
    user.phone = phone || user.phone;

    await user.save();

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});
// get info about a particular user

app.post("/upload-image", async (req, res) => {
  const { base64 } = req.body;
  try {
    await Images.create({ image: base64 });
    res.send({ Status: "ok" });
  } catch (error) {
    res.send({ Status: "error", data: error });
  }
});

//controller functions for requests

app.post("/submit-request", async (req, res) => {
  try {
    const { userId, documentId, content } = req.body;
    console.log(req.body);
    const newRequest = new Request({
      userId,
      documentId,
      content,
    });
    const savedRequest = await newRequest.save();
    res.status(201).json({
      success: true,
      status: "ok",
      message: "Request submitted successfully",
      data: savedRequest,
    });
  } catch (error) {
    console.error("Error submitting request:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get("/getAllRequests", async (req, res) => {
  try {
    // const requests = await Request.find({})
    //   .populate("userId", "fname lname")
    //   .populate("documentId", "docName pdf version remarks");

    const requests = await Request.findAll({
      include: [
        {
          model: UserInfo,
          as: 'user',
          attributes: ['fname', 'lname']
        },
        {
          model: PdfDetails,
          as: 'document',
          attributes: ['docName', 'pdf', 'version', 'remarks']
        },
        {
          model: UserInfo,
          as: 'updater',
          attributes: ['fname', 'lname']
        }
      ]
    });
    res.status(200).json({ success: true, requests: requests });
  } catch (error) {
    console.error("Error fetching requests:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Error fetching requests" });
  }
});

app.put("/requests/:requestId", async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;

  try {
    // Find the request by ID
    // const request = await Request.findById(requestId);
    const request = await Request.findByPk(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Update the request status
    request.requestStatus = status;
    await request.save()

    res
      .status(200)
      .json({ message: "Request status updated successfully", request });
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// user creation code

// ...

app.post("/createuser", async (req, res) => {
  const { fname, lname, email, password } = req.body;

  const encryptedPassword = await bcrypt.hash(password, 10);

  try {
    const existingUser = await UserInfo.findOne({ email });

    if (existingUser) {
      return res.json({ error: "User Already Exists" });
    }

    await UserInfo.create({
      fname,
      lname,
      email,
      password: encryptedPassword,
      userType: "user", // Assuming you want to set a default user type as "user".
      phone,
      department,
      gender,
    });

    res.send({ status: "ok" });
  } catch (error) {
    console.error(error);
    res.json({ status: "error", message: "User creation failed" });
  }
});

// separate controller function for fetching key metrics for admin dashboard

// app.get("/getKeyMetricsForAdminDashboard", async (req, res) => {
//   try {
//     // Query the database to count the total number of documents
//     const totalDocumentsUploaded = await PdfDetails.countDocuments();

//     // Query the database to count the total number of draft documents
//     const totalDraftDocuments = await PdfDetails.countDocuments({
//       accessControl: "private",
//     });

//     // Count total number of requests made by the user
//     const totalRequests = await Request.countDocuments();

//     // Query the database for users whose userType is not 'Admin'
//     const totalNonAdminUsers = await UserInfo.countDocuments({
//       userType: "User",
//     });

//     // Query the database for users whose userType is 'Admin'
//     const totalAdminUsers = await UserInfo.countDocuments({
//       userType: "Admin",
//     });

//     // Query the database for users who are currently logged in (online)
//     const totalOnlineUsers = await UserInfo.countDocuments({
//       isLoggedIn: true,
//     });

//     // Send the total count of non-admin users, total documents uploaded, total draft documents, and total admin users as the response
//     res.status(200).json({
//       totalNonAdminUsers: totalNonAdminUsers,
//       totalAdminUsers: totalAdminUsers,
//       totalDocumentsUploaded: totalDocumentsUploaded,
//       totalRequests: totalRequests,
//       totalDraftDocuments: totalDraftDocuments,
//       totalOnlineUsers: totalOnlineUsers,
//     });
//   } catch (error) {
//     // Handle any errors
//     res.status(500).json({ message: error.message });
//   }
// });


app.get('/getKeyMetricsForAdminDashboard', async (req, res) => {
  try {
    // Count total number of documents
    const totalDocumentsUploaded = await PdfDetails.count();

    // Count total number of draft documents (private access)
    const totalDraftDocuments = await PdfDetails.count({
      where: { accessControl: 'private' }
    });

    // Count total number of requests
    const totalRequests = await Request.count();

    // Count total number of non-admin users
    const totalNonAdminUsers = await UserInfo.count({
      where: { userType: 'User' }
    });

    // Count total number of admin users
    const totalAdminUsers = await UserInfo.count({
      where: { userType: 'Admin' }
    });

    // Count total number of online users
    const totalOnlineUsers = await UserInfo.count({
      where: { isLoggedIn: true }
    });

    // Send the response with the counts    
    res.status(200).json({
      totalNonAdminUsers,
      totalAdminUsers,
      totalDocumentsUploaded,
      totalRequests,
      totalDraftDocuments,
      totalOnlineUsers
    });
  } catch (error) {
    // Handle errors
    console.log(error);

    res.status(500).json({ message: error.message });
  }
});

// Controller function for creating notifications for users depending upon the department
app.post("/createNotification", async (req, res) => {
  try {
    const { message, department } = req.body;

    // Find all users belonging to the Admin department
    // const adminUsers = await UserInfo.find({ department: department });
    const adminUsers = await UserInfo.findAll({
      where: {
        department: department,
      },
    });

    // Extract the ObjectIds of admin users
    const adminUserIds = adminUsers.map((user) => user._id);

    // Create a notification with multiple recipients
    const notification = new Notifications({
      message: message,
      recipients: adminUserIds, // Set the recipients array
      recipientsGroup: department,
    });

    // Save the notification document
    const createdNotification = await notification.save();

    res.status(201).json({ success: true, notification: createdNotification });
  } catch (error) {
    console.error("Error creating notifications:", error.message);
    res.status(500).json({
      success: false,
      message: "Error creating notifications",
    });
  }
});

// Controller function for fetching notifications based on the currently logged-in user's _id
app.get("/getNotificationsByUserId/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch notifications function
    async function fetchNotifications(userId) {
      const query = `
        SELECT n.*
        FROM Notifications n
        JOIN NotificationRecipients nr ON n.id = nr.notificationId
        WHERE nr.userInfoId = ?
        ORDER BY n.createdAt DESC
      `;
      const [results] = await sequelize.query(query, {
        replacements: [userId],
        type: sequelize.QueryTypes.SELECT
      });
      return results;
    }

    // Call the fetch function and handle response
    const notifications = await fetchNotifications(userId);

    res.status(200).json({ success: true, notifications: notifications || [] });
  } catch (error) {
    console.error("Error fetching notifications by user ID:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications by user ID",
    });
  }
});

// Controller function for upadting the value of readBy
app.put("/markNotificationAsRead", async (req, res) => {
  try {
    // Extract user ID from request body
    const { userId, notificationId } = req.body;

    // Check if the user exists
    const user = await UserInfo.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if the notification exists
    const notification = await Notifications.findById(notificationId);
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    // Add user ID to the readBy array if not already present
    if (!notification.readBy.includes(userId)) {
      notification.readBy.push(userId);
      await notification.save();
    }

    res
      .status(200)
      .json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Creating notification controller for a separate user
app.post("/sendNotification/:userId", async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.params.userId;

    // Create a notification for a specific user
    const notification = new Notifications({
      message: message,
      recipients: [userId], // Set the recipient as an array with the provided userId
    });

    // Save the notification document
    const createdNotification = await notification.save();

    res.status(201).json({ success: true, notification: createdNotification });
  } catch (error) {
    console.error("Error sending notification:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Error sending notification" });
  }
});

// controller and endpoint for Department
// app.post("/department/new", async (req, res) => {
//   const { name, description, manager } = req.body;
//   try {
//     const existingDepartment = await Department.findOne({ name });
//     if (existingDepartment) {
//       res.status(400).json({ message: "Department must be unique!" });
//     }
//     const newDepartment = new Department({ name, description, manager });
//     await newDepartment.save();
//     const allDepartments = await Department.find({}, "name");
//     res.status(201).json({
//       message: "Department added successfully.",
//       departments: allDepartments,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Server error" });
//   }
// });


app.post("/department/new", async (req, res) => {
  const { name, description, manager } = req.body;

  try {
    // Check if the department already exists
    const [existingDepartments] = await sequelize.query(
      'SELECT * FROM departments WHERE name = ?',
      {
        replacements: [name],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Check if existingDepartments is defined and has elements
    if (Array.isArray(existingDepartments) && existingDepartments.length > 0) {
      return res.status(400).json({ message: "Department must be unique!" });
    }

    // Insert new department
    await sequelize.query(
      'INSERT INTO departments (name, description, manager) VALUES (?, ?, ?)',
      {
        replacements: [name, description, manager],
        type: sequelize.QueryTypes.INSERT,
      }
    );

    // Retrieve all departments
    const [allDepartments] = await sequelize.query(
      'SELECT name FROM departments',
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.status(201).json({
      message: "Department added successfully.",
      departments: allDepartments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all departments
app.get("/departments", async (req, res) => {
  try {
    // const departments = await Department.find({}, "name");
    const departments = await Department.findAll({
      attributes:['name']
    })
    res.status(200).json(departments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export const handler = serverless(app);
