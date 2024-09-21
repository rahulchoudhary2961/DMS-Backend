import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('document_management', 'admin', 'Hashing1999', {
  host: 'document-management-system.c5u42kg8ghf7.us-east-1.rds.amazonaws.com',
  dialect: 'mysql',
  logging: true,
});

export default sequelize;



// const start = () =>{
//   const connection = mysql.createConnection({
//       host: 'document-management-system.c5u42kg8ghf7.us-east-1.rds.amazonaws.com',
//       user: 'admin',
//       password: "Hashing1999",
//       database: "document_management",
//   });
  
//   connection.connect((err) => {
//       if (err) throw err;
//       console.log('Connected to the database!');
//   });
// }
// start()