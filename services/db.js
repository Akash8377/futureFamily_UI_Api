const mysql = require("mysql");
const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "future_family_ai",
});

conn.connect();
module.exports = conn;
