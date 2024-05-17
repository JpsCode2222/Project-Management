// Import packages
const express = require("express");
const bodyparser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const execute = require("./routes/conn.js");

// Import route
const adminRoute = require("./routes/adminRoute.js");

// App
const app = express();

// Middlewares
// app.use(
//   cors({
//     origin: ["http://localhost:3000/"],
//     methods: ["GET", "POST", "DELETE", "PUT"],
//     credentials: true,
//   })
// );

app.use(cors({ origin: true }));
app.use(express.json()); // Parse incoming JSON data
app.use(bodyparser.urlencoded({ extended: true }));
app.use(cookieParser());

// routes
app.use("/", adminRoute);

app.listen(1000, () => console.log("Server listening on port 1000"));
