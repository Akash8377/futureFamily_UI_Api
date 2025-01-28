const express = require("express");
const routes = require("./routes/routes");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const AppError = require("./utils/appError");
const errorHandler = require("./utils/errorHandler");
const path = require("path");
require("dotenv").config();
const cors = require("cors"); // Import the cors middleware
const app = express();

app.use(express.static(path.resolve("./public")));
global.__basedir = __dirname;
//upload globally
app.use(cors());
// Static Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(express.urlencoded({ extended: true }));
app.use("/", routes);

app.all("*", (req, res, next) => {
  next(new AppError(`The URL ${req.originalUrl} does not exist`, 404));
});

app.use(errorHandler);

const hostname = process.env.HOST || "127.0.0.1";
const port = process.env.PORT || 8800;

app.listen(port, hostname, () => {
  console.log(`Server running on http://${hostname}:${port}`);
});

module.exports = app;
