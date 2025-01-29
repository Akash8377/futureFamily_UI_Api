const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const token_key = process.env.TOKEN_KEY;

// Signup Function
exports.signup = (req, res) => {
  // Validate user input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ errors: errors.array() });
  }

  const { first_name, last_name, looking_for, gender, email, password } =
    req.body;

  // Check if user already exists
  conn.query(
    `SELECT * FROM users WHERE email = ${conn.escape(email)}`,
    (err, result) => {
      if (err) {
        return res.status(500).send({
          msg: "Database error",
          error: err,
        });
      }
      if (result.length) {
        return res.status(400).send({
          msg: "User already exists!",
        });
      }

      // Hash password before saving
      bcrypt.hash(password, 10, (hashErr, hash) => {
        if (hashErr) {
          return res.status(500).send({
            msg: "Error hashing password",
            error: hashErr,
          });
        }

        conn.query(
          `INSERT INTO users (first_name, last_name, gender, looking_for, email, password) VALUES (${conn.escape(
            first_name
          )}, ${conn.escape(last_name)}, ${conn.escape(gender)}, ${conn.escape(
            looking_for
          )}, ${conn.escape(email)}, ${conn.escape(hash)})`,
          (insertErr, insertResult) => {
            if (insertErr) {
              return res.status(500).send({
                msg: "Database error",
                error: insertErr,
              });
            }
            return res.status(201).send({
              status: "success",
              msg: "User registered successfully!",
              data: {
                id: insertResult.insertId,
                email,
              },
            });
          }
        );
      });
    }
  );
};

// Login function User login

exports.getUserLogin = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ errors: errors.array() });
  }
  conn.query(
    `SELECT * FROM users WHERE email = ${conn.escape(req.body.email)}`,
    (err, result) => {
      if (err) {
        return res.status(400).send({
          msg: err,
        });
      }
      if (!result.length) {
        return res.status(400).send({
          msg: "Email or Password is incorrect!",
        });
      }
      bcrypt.compare(
        req.body.password,
        result[0]["password"],
        (bErr, bresult) => {
          if (bErr) {
            return res.status(400).send({
              msg: bErr,
            });
          }
          if (bresult) {
            const token = jwt.sign({ id: result[0]["id"] }, token_key, {
              expiresIn: "1h",
            });

            res.status(200).send({
              status: "success",
              token,
              length: result?.length,
              data: result,
            });
          } else {
            return res.status(400).send({
              msg: "Email or Password is incorrect!",
            });
          }
        }
      );
    }
  );
};


// Login function get login

exports.getLogin = (req, res) => {
  // Since the user is already authenticated, get userId from the request
  const userId = req.headers.user_id;

  if (!userId) {
    return res.status(401).send({ msg: "Unauthorized" });
  }

  // Fetch user details using the userId from the JWT token
  conn.query("SELECT * FROM users WHERE id = ?", [userId], (err, result) => {
    if (err) {
      return res.status(500).send({ msg: "Database error", error: err });
    }

    if (!result.length) {
      return res.status(404).send({ msg: "User not found" });
    }

    res.status(200).send({
      status: "success",
      user: result[0], // Return only relevant user details
    });
  });
};


// Get login User Profile

exports.welcome = (req, res) => {
  const authToken = req.headers.authorization.split(" ")[1];
  const decode = jwt.verify(authToken, token_key);
  conn.query(
    `SELECT * FROM users where id =?`,
    decode.id,
    function (error, result, field) {
      if (error) throw error;
      return res.status(200).send({
        succes: true,
        data: result[0],
        msg: "Fetch Successfully!",
      });
    }
  );
};

// Logout Function

exports.logout = (req, res) => {
  const tokenBlacklist = new Set();
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(400).send({ message: "Token is required for logout" });
  }

  // Add the token to the list of revoked tokens

  tokenBlacklist.add(token);

  res.status(200).send({ message: "Logged out successfully" });
};
