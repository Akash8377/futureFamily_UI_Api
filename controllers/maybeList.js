const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const token_key = process.env.TOKEN_KEY;

exports.maybeUser = (req, res) => {
    const user_id = req.userId; // Logged-in user ID
    const { maybe_user_id, status } = req.body;
    console.log(req.body)
  
    
  
    const query = `
      INSERT INTO user_maybe (user_id, maybe_user_id, status)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW();
    `;
  
    conn.query(query, [user_id, maybe_user_id, status], (err) => {
      if (err) {
        return res.status(500).json({ msg: "Database error", error: err });
      }
      res.status(200).json({ msg: "Maybe updated successfully" });
    });
  };
  
  exports.removeMaybeUser = (req, res) => {
    const user_id = req.userId;
    const { maybe_user_id } = req.body;
  
    if (!maybe_user_id) {
      return res.status(400).json({ msg: "Invalid input data" });
    }
  
    const query = `DELETE FROM user_maybe WHERE user_id = ? AND maybe_user_id = ?`;
  
    conn.query(query, [user_id, maybe_user_id], (err) => {
      if (err) {
        return res.status(500).json({ msg: "Database error", error: err });
      }
      res.status(200).json({ msg: "User removed from maybe" });
    });
  };
  

  exports.blacklistUser = (req, res) => {
    const user_id = req.userId; // Logged-in user ID
    const { maybe_user_id, status } = req.body;
    console.log(req.body)
  
    
  
    const query = `
      INSERT INTO user_maybe (user_id, maybe_user_id, status)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW();
    `;
  
    conn.query(query, [user_id, maybe_user_id, status], (err) => {
      if (err) {
        return res.status(500).json({ msg: "Database error", error: err });
      }
      res.status(200).json({ msg: "Blacklisted successfully" });
    });
  };