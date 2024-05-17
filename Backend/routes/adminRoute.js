// packages
var express = require("express");
var execute = require("./conn.js");
var rout = express.Router();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const cors = require("cors");

// register admin
rout.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const sql = `INSERT INTO admin (username,email,password) VALUES ('${username}','${email}','${password}')`;
  const admin = await execute(sql);
  if (admin) {
    return res.status(200).json({ message: "Registration successfull" });
  } else {
    return res.status(409).json({ message: "Registration Failed" });
  }
});

// login
rout.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const sql = `SELECT * FROM admin WHERE email='${email}' AND password = '${password}'`;
    const admin = await execute(sql);
    if (admin.length <= 0) {
      return res.status(401).json({ Success: false, Message: "Invalid User" });
    } else {
      const payload = { email };
      const secret = process.env.JWT_SECRET;
      // generate token
      // payload , secreat, expiresIn
      const token = jwt.sign(payload, secret, {
        expiresIn: "3h",
      });
      //   store token in cookie
      if (token) {
        return res.json({ token, Success: true, Message: "Valid User" });
      } else {
        return res.json({ Success: false, Message: "Invalid User" });
      }
    }
  } catch (error) {
    return res.status(401).json({ Success: false, Message: error.message });
  }
});

// Insert porject
rout.post("/insert_project", async (req, res) => {
  var d = req.body;
  const sql = `INSERT INTO project(project_name,reason,type,division,category,priority,department,start_date,end_date,location,status,close_date) VALUES ('${d.project_name}','${d.reason}','${d.type}','${d.division}','${d.category}','${d.priority}','${d.department}','${d.start_date}','${d.end_date}','${d.location}','Registered','${d.end_date}')`;
  const project = await execute(sql);
  return res.status(200).json({
    Status: true,
    Message: "New project added successfully",
  });
});

// Get all projects
rout.get("/get_projects", async (req, res) => {
  const sql = `SELECT * FROM project ORDER BY project_id DESC`;
  const projects = await execute(sql);
  return res.status(200).json(projects);
});

// change status of project
rout.post("/change_status", async (req, res) => {
  var d = req.body;
  const date = new Date();

  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();
  const currentDate =
    year.toString() + "-" + month.toString() + "-" + day.toString();

  if (d.status === "Closed") {
    var sql = `UPDATE project SET status = '${d.status}' , close_date = '${currentDate}' WHERE project_id = '${d.id}'`;
  } else {
    var sql = `UPDATE project SET status = '${d.status}' WHERE project_id = '${d.id}'`;
  }
  await execute(sql);
  res
    .status(200)
    .json({ Status: true, Message: "Project Updated Successfully" });
});

// get project info like count , deparment and closure_delay
rout.get("/get_project_count", async (req, res) => {
  const sql = `SELECT * FROM project`;
  const all_projects = await execute(sql);
  // set initial value 0
  var total_project_count = all_projects.length;
  var running_project_count = 0;
  var close_project_count = 0;
  var cancel_project_count = 0;

  const sql2 = `SELECT COUNT(*) AS closer_delay FROM project WHERE close_date > end_date`;
  const closer_delay = await execute(sql2);

  const sql1 = `SELECT department, COUNT(*) AS totalProjects, SUM(CASE WHEN status='Closed' THEN 1 ELSE 0 END) AS closeProjects FROM project GROUP BY department`;
  const departmen_info = await execute(sql1);
  const project_data = departmen_info.map((closeProject) => {
    var all_project_info = {
      departments: closeProject.department,
      totalProject: closeProject.totalProjects,
      closeProject: closeProject.closeProjects,
      closer_delay,
    };
    return all_project_info;
  });

  // project counting
  for (var i = 0; i < all_projects.length; i++) {
    if (all_projects[i].status === "Running") running_project_count += 1;
    if (all_projects[i].status === "Closed") close_project_count += 1;
    if (all_projects[i].status === "Cancelled") cancel_project_count += 1;
  }
  if (total_project_count > 0) {
    res.status(200).json({
      total_project_count,
      running_project_count,
      close_project_count,
      cancel_project_count,
      project_data,
    });
  } else {
    res.status(404).json({ Status: false, Message: "Projects not found" });
  }
});

// to verify token
rout.post("/verify_token", async (req, res) => {
  const { token } = req.body;
  // verify token
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(404).json({ Success: false, Message: "Invalid Token" });
    }
    const sql = `SELECT * FROM admin WHERE email = '${decoded.email}'`;
    const admin = await execute(sql);
    const username = admin.username;
    if (admin.length > 0)
      return res
        .status(200)
        .json({ Success: true, Message: "Valid Token", username });
    else
      return res
        .status(404)
        .json({ Success: false, Message: "Invalid Token", username });
  });
});

// export
module.exports = rout;
