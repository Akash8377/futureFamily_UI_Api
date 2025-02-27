const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const token_key = process.env.TOKEN_KEY;

exports.shortlistUser = (req, res) => {
  const user_id = req.userId; // Logged-in user ID
  const { shortlisted_user_id, status } = req.body;

  const shortlistQuery = `
    INSERT INTO user_shortlisted (user_id, shortlisted_user_id, status)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW();
  `;

  conn.query(shortlistQuery, [user_id, shortlisted_user_id, status], (err) => {
    if (err) {
      return res.status(500).json({ msg: "Database error", error: err });
    }

    // Check if the other user has also shortlisted the current user
    const checkMutualShortlistQuery = `
      SELECT * FROM user_shortlisted
      WHERE user_id = ? AND shortlisted_user_id = ? AND status = 1;
    `;

    conn.query(checkMutualShortlistQuery, [shortlisted_user_id, user_id], (err, results) => {
      if (err) {
        return res.status(500).json({ msg: "Database error", error: err });
      }

      if (results.length > 0) {
        // Both users have shortlisted each other, add to message_listing table
        const insertMessageListingQuery = `
          INSERT INTO message_listing (user1_id, user2_id)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE updated_at = NOW();
        `;

        conn.query(insertMessageListingQuery, [user_id, shortlisted_user_id], (err) => {
          if (err) {
            return res.status(500).json({ msg: "Database error", error: err });
          }
        });
      }

      // Fetch the full profile details of the shortlisted user
      const profileQuery = `
        SELECT * FROM profile_data
        WHERE user_id = ?;
      `;

      conn.query(profileQuery, [shortlisted_user_id], (err, results) => {
        if (err) {
          console.error("Error fetching profile details:", err);
          return res.status(500).json({ msg: "Database error", error: err });
        }

        if (results.length === 0) {
          return res.status(404).json({ msg: "User profile not found" });
        }

        const profileDetails = results[0];

        // Create a notification message with full profile details
        const notificationMessage = JSON.stringify({
          message: `You have been shortlisted by user ${user_id}`,
          profile: profileDetails // Include full profile details
        });

        // Insert the notification into the database
        const notificationQuery = `
          INSERT INTO notifications (user_id, notifications_user_id, message)
          VALUES (?, ?, ?);
        `;

        conn.query(
          notificationQuery,
          [shortlisted_user_id, user_id, notificationMessage], // Set notifications_user_id to the logged-in user's ID
          (err) => {
            if (err) {
              console.error("Error adding notification:", err);
            }
          }
        );

        res.status(200).json({ msg: "Shortlist updated successfully" });
      });
    });
  });
};
exports.getNotifications = (req, res) => {
  const user_id = req.userId;

  const query = `
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC;
  `;

  conn.query(query, [user_id], (err, results) => {
      if (err) {
          return res.status(500).json({ msg: "Database error", error: err });
      }

      // Parse the message field to extract profile details
      const notifications = results.map(notification => {
          try {
              return {
                  ...notification,
                  message: JSON.parse(notification.message)
              };
          } catch (error) {
              // If parsing fails, return the raw message
              return {
                  ...notification,
                  message: notification.message // Fallback to plain text
                
              };
          }
      });

      res.status(200).json({ notifications });
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