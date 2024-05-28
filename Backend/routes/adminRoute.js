// packages
var express = require("express");
var execute = require("./conn.js");
var rout = express.Router();
const jwt = require("jsonwebtoken");
require("dotenv").config();

// register admin
rout.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const sql = `INSERT INTO admin (username,email,password) VALUES ('${username}','${email}','${password}')`;
  const admin = await execute(sql);
  if (admin) {
    return res
      .status(200)
      .json({ status: true, message: "Registration successfull" });
  } else {
    return res
      .status(409)
      .json({ status: false, message: "Registration Failed" });
  }
});

// verify token middleware
const verifyToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ Success: false, message: "Token not found" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ Success: false, Message: "Invalid User" });
    } else {
      // req.email = decoded.email; // email fetch from token
      next();
    }
  });
};

// login
rout.post("/login", async (req, res) => {
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

    // Set a cookie
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
    });

    if (token) {
      return res.json({ token, Success: true, Message: "Valid User" });
    } else {
      return res.json({ Success: false, Message: "Invalid User" });
    }
  }
});

// Logout
rout.get("/logout", function (req, res) {
  res.clearCookie("token");
  return res.status(200).json({ Success: true, Message: "Logout Successfull" });
});

// Insert porject
rout.post("/insert-project", verifyToken, async (req, res) => {
  var d = req.body;
  const sql = `INSERT INTO project(project_name,reason,type,division,category,priority,department,start_date,end_date,location,status) VALUES ('${d.project_name}','${d.reason}','${d.type}','${d.division}','${d.category}','${d.priority}','${d.department}','${d.start_date}','${d.end_date}','${d.location}','Registered')`;
  const project = await execute(sql);
  return res.status(200).json({
    Status: true,
    Message: "New project added successfully",
    project,
  });
});

// Get all projects
rout.get("/get-all-projects", verifyToken, async (req, res) => {
  const sql = `SELECT * FROM project ORDER BY project_id DESC`;
  const projects = await execute(sql);
  return res.status(200).json(projects);
});

// change status of project
rout.post("/change-project-status", verifyToken, async (req, res) => {
  var d = req.body;
  var sql = `UPDATE project SET status = '${d.status}' WHERE project_id = '${d.id}'`;
  await execute(sql);
  res
    .status(200)
    .json({ Status: true, Message: "Project Updated Successfully" });
});

// get project info like count , deparment and closure_delay
rout.get("/get-project-count", verifyToken, async (req, res) => {
  const sql1 = `SELECT COUNT(*) as total_project_count, SUM(CASE WHEN status = 'Running' THEN 1 ELSE 0 END) AS running_project_count, SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) AS close_project_count, SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancel_project_count  from project;`;

  const projects = await execute(sql1);

  const total_project_count = projects[0].total_project_count;
  const running_project_count = projects[0].running_project_count;
  const close_project_count = projects[0].close_project_count;
  const cancel_project_count = projects[0].cancel_project_count;

  const sql2 = `SELECT COUNT(*) AS closer_delay FROM project WHERE status='Running' AND end_date < CURDATE()`;
  const cd = await execute(sql2);

  if (total_project_count > 0) {
    res.status(200).json({
      total_project_count: total_project_count,
      running_project_count: running_project_count,
      close_project_count: close_project_count,
      cancel_project_count: cancel_project_count,
      closer_delay: cd[0].closer_delay,
    });
  } else {
    res.status(404).json({ Status: false, Message: "Projects not found" });
  }
});

rout.get("/get-chart-data", verifyToken, async (req, res) => {
  const sql = `SELECT department, COUNT(*) AS totalProjects,
  SUM(CASE WHEN status='Closed' THEN 1 ELSE 0 END) AS closeProjects, (SUM (CASE WHEN status='Closed' THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS percentage FROM project GROUP BY department`;

  // unique departments , total_projects , close_projects
  const departmentwise_info = await execute(sql);

  const all_departments_data = departmentwise_info.map((project) => {
    var all_project_info = {
      departments: project.department,
      totalProject: project.totalProjects,
      closeProject: project.closeProjects,
      percentage: Math.round(project.percentage),
    };
    return all_project_info;
  });

  if (all_departments_data.length > 0) {
    return res.status(200).json(all_departments_data);
  } else {
    return res.status(401).json(all_departments_data, "Projects not found");
  }
});

rout.get("/get_departments_percentage", async (req, res) => {
  const sql = `SELECT  department , (COUNT(*)) AS total_count FROM project GROUP BY department`;
  const depts = await execute(sql);
  res.send(depts);
  // console.log(depts);
});

// export
module.exports = rout;
