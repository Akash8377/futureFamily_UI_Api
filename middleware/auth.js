const AppError = require("../utils/appError");
const conn = require("../services/db");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const token_key = process.env.TOKEN_KEY;



exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send({ msg: "Please provide a valid token" });
    }

    const token = authHeader.split(" ")[1]; // Extract the token

    // Verify the token and extract user ID
    jwt.verify(token, process.env.TOKEN_KEY, (err, decoded) => {
      if (err) {
        return res.status(403).send({ msg: "Invalid or expired token" });
      }
      req.userId = decoded.id; // Attach user ID to the request
      next();
    });

  } catch (error) {
    return res.status(500).send({ msg: "Internal server error", error });
  }
};