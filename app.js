const express = require("express");
const routes = require("./routes/routes");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const AppError = require("./utils/appError");
const errorHandler = require("./utils/errorHandler");
const path = require("path");
require("dotenv").config();
const cors = require("cors");
const app = express();

app.use(express.static(path.resolve("./public")));
global.__basedir = __dirname;
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(express.urlencoded({ extended: true }));

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

app.use("/", routes);

app.all("*", (req, res, next) => {
  next(new AppError(`The URL ${req.originalUrl} does not exist`, 404));
});

app.use(errorHandler);

const hostname = process.env.HOST || "0.0.0.0";
const port = process.env.PORT || 8800;

app.listen(port, hostname, () => {
  console.log(`Server running on http://${hostname}:${port}`);
});

module.exports = app;
