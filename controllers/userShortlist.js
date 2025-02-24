const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const token_key = process.env.TOKEN_KEY;

exports.shortlistUser = (req, res) => {
    const user_id = req.userId; // Logged-in user ID
    const { shortlisted_user_id, status } = req.body;
    console.log(req.body)
  
    
  
    const query = `
      INSERT INTO user_shortlisted (user_id, shortlisted_user_id, status)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW();
    `;
  
    conn.query(query, [user_id, shortlisted_user_id, status], (err) => {
      if (err) {
        return res.status(500).json({ msg: "Database error", error: err });
      }
      res.status(200).json({ msg: "Shortlist updated successfully" });
    });
  };
  


  exports.removeShortlistedUser = (req, res) => {
    const user_id = req.userId;
    const { shortlisted_user_id } = req.body;
  
    if (!shortlisted_user_id) {
      return res.status(400).json({ msg: "Invalid input data" });
    }
  
    const query = `DELETE FROM user_shortlisted WHERE user_id = ? AND shortlisted_user_id = ?`;
  
    conn.query(query, [user_id, shortlisted_user_id], (err) => {
      if (err) {
        return res.status(500).json({ msg: "Database error", error: err });
      }
      res.status(200).json({ msg: "User removed from shortlist" });
    });
  };
  

  exports.blacklistUser = (req, res) => {
    const user_id = req.userId; // Logged-in user ID
    const { shortlisted_user_id, status } = req.body;
    console.log(req.body)
  
    
  
    const query = `
      INSERT INTO user_shortlisted (user_id, shortlisted_user_id, status)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW();
    `;
  
    conn.query(query, [user_id, shortlisted_user_id, status], (err) => {
      if (err) {
        return res.status(500).json({ msg: "Database error", error: err });
      }
      res.status(200).json({ msg: "Blacklisted successfully" });
    });
  };