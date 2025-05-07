const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const token_key = process.env.TOKEN_KEY;
const updateLastSeen = (userId) => {
  const query = `UPDATE users SET last_seen = NOW() WHERE id = ?`;
  conn.query(query, [userId], (err) => {
    if (err) {
      console.error("Error updating last_seen:", err);
    }
  });
};

const isUserOnline = (lastSeen) => {
  const now = new Date();
  const lastSeenTime = new Date(lastSeen);
  const minutesSinceLastSeen = (now - lastSeenTime) / (1000 * 60); // Convert to minutes
  return minutesSinceLastSeen <= 5; // User is online if last seen within 5 minutes
};

exports.signup = (req, res) => {
  // Validate user input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ errors: errors.array() });
  }

  const { first_name, last_name, looking_for, gender, email, password } = req.body;

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

        // Insert user into users table
        const userInsertQuery = `INSERT INTO users (first_name, last_name, gender, looking_for, email, password) VALUES (?, ?, ?, ?, ?, ?)`;
        const userValues = [first_name, last_name, gender, looking_for, email, hash];

        conn.query(userInsertQuery, userValues, (insertErr, insertResult) => {
          if (insertErr) {
            return res.status(500).send({
              msg: "Database error while inserting user",
              error: insertErr,
            });
          }

          const user_id = insertResult.insertId; // Get the inserted user's ID

          // Insert empty profile record for the user
          const profileInsertQuery = `INSERT INTO profile_data (user_id, created_at, updated_at) VALUES (?, NOW(), NOW())`;

          conn.query(profileInsertQuery, [user_id], (profileErr) => {
            if (profileErr) {
              return res.status(500).send({
                msg: "Database error while creating user profile",
                error: profileErr,
              });
            }

            return res.status(201).send({
              status: "success",
              msg: "User registered successfully!",
              data: {
                id: user_id,
                email,
              },
            });
          });
        });
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

  conn.query(`SELECT * FROM users WHERE email = ${conn.escape(req.body.email)}`, (err, result) => {
    if (err) {
      return res.status(400).send({ msg: err });
    }
    if (!result.length) {
      return res.status(400).send({ msg: "Email or Password is incorrect!" });
    }

    bcrypt.compare(req.body.password, result[0]["password"], (bErr, bresult) => {
      if (bErr) {
        return res.status(400).send({ msg: bErr });
      }
      if (bresult) {
        // Extend token expiration to 10 hours
        const token = jwt.sign({ id: result[0]["id"] }, token_key, { expiresIn: "10h" });

        const updateOnlineStatusQuery = `UPDATE users SET online = TRUE, last_seen = NOW() WHERE id = ?`;
        conn.query(updateOnlineStatusQuery, [result[0]["id"]], (updateErr) => {
          if (updateErr) {
            console.error("Error updating online status:", updateErr);
          }
        });

        res.status(200).send({
          status: "success",
          token,
          length: result?.length,
          data: result,
        });
      } else {
        return res.status(400).send({ msg: "Email or Password is incorrect!" });
      }
    });
  });
};



exports.getLogin = (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).send({ msg: "Unauthorized" });
  }

  conn.query("SELECT * FROM users WHERE id = ?", [userId], (err, result) => {
    if (err) {
      return res.status(500).send({ msg: "Database error", error: err });
    }

    if (!result.length) {
      return res.status(404).send({ msg: "User not found" });
    }

    const user = result[0];

    const updateLastSeenQuery = `UPDATE users SET last_seen = NOW(), online = TRUE WHERE id = ?`;
    conn.query(updateLastSeenQuery, [userId], (updateErr) => {
      if (updateErr) {
        console.error("Error updating last_seen:", updateErr);
      }
    });

    const online = isUserOnline(user.last_seen);

    res.status(200).send({
      status: "success",
      user: {
        ...user,
        last_seen: user.last_seen,
        online,
      },
    });
  });
};


exports.welcome = (req, res) => {
  const authToken = req.headers.authorization.split(" ")[1];
  const decode = jwt.verify(authToken, token_key);
  console.log("User Id",decode.id)
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

exports.logout = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(400).send({ message: "Token is required for logout" });
  }

  jwt.verify(token, token_key, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Invalid token" });
    }

    const userId = decoded.id;

    const updateOfflineStatusQuery = `UPDATE users SET online = FALSE WHERE id = ?`;
    conn.query(updateOfflineStatusQuery, [userId], (updateErr) => {
      if (updateErr) {
        console.error("Error updating offline status:", updateErr);
      }
    });

    res.status(200).send({ message: "Logged out successfully" });
  });
};