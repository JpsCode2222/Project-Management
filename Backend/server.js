// Import packages
const express = require("express");
const bodyparser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Import route
const adminRoute = require("./routes/adminRoute.js");

// App
const app = express();

// middlewares
app.use(express.json()); // Parse incoming JSON data
app.use(bodyparser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["POST", "GET"],
    credentials: true,
  })
);

// routes
app.use("/", adminRoute);

// PORT
const PORT = 1000;

// listening on port 3000
app.listen(PORT, () => console.log("Server listening on port : " + PORT));
