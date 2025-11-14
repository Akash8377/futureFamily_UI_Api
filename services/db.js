// const mysql = require("mysql");

// const conn = mysql.createConnection({
//   host: "database-1.cdycq8wyosjv.eu-north-1.rds.amazonaws.com",
//   port: 3306,
//   user: "admin",
//   password: "future2025",
//   database: "future_family_ai",
// });

// conn.connect((err) => {
//   if (err) {
//     console.error("Database connection error:", err.stack);
//     return;
//   }
//   console.log("Connected to database.");
// });

// module.exports = conn;


const mysql = require("mysql");
const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "future_family_ai",
});

conn.connect();
module.exports = conn;
