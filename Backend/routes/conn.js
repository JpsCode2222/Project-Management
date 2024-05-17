// packages
var mysql = require("mysql");
var util = require("util");

// connection
var conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "project_management",
});

// if error
conn.connect(function (err) {
  if (err) {
    console.log("MYSQL not connected");
    return err;
  }
  console.log("MYSQL Connected!");
});

// bind query
var execute = util.promisify(conn.query).bind(conn);

// export
module.exports = execute;
