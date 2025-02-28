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
            console.error("Error adding to message_listing:", err);
            // Do not send a response here, just log the error
          }
        });
      }

      // Fetch the full profile details of the logged-in user (who performed the shortlisting)
      const loggedInUserQuery = `
        SELECT * FROM profile_data
        WHERE user_id = ?;
      `;

      conn.query(loggedInUserQuery, [user_id], (err, loggedInUserResults) => {
        if (err) {
          console.error("Error fetching logged-in user profile details:", err);
          return res.status(500).json({ msg: "Database error", error: err });
        }

        if (loggedInUserResults.length === 0) {
          return res.status(404).json({ msg: "Logged-in user profile not found" });
        }

        const loggedInUser = loggedInUserResults[0];

        // Fetch the full profile details of the shortlisted user
        const profileQuery = `
          SELECT * FROM profile_data
          WHERE user_id = ?;
        `;

        conn.query(profileQuery, [shortlisted_user_id], (err, results) => {
          if (err) {
            console.error("Error fetching shortlisted user profile details:", err);
            return res.status(500).json({ msg: "Database error", error: err });
          }

          if (results.length === 0) {
            return res.status(404).json({ msg: "Shortlisted user profile not found" });
          }

          const shortlistedUser = results[0];

          // Create a notification message with details of both users
          const notificationMessage = JSON.stringify({
            message: `You have been shortlisted by ${loggedInUser.first_name} ${loggedInUser.last_name}`,
            shortlisted_by: {
              user_id: loggedInUser.user_id,
              first_name: loggedInUser.first_name,
              last_name: loggedInUser.last_name,
              profile_pic: loggedInUser.profile_pic,
            },
            shortlisted_user: {
              user_id: shortlistedUser.user_id,
              first_name: shortlistedUser.first_name,
              last_name: shortlistedUser.last_name,
              profile_pic: shortlistedUser.profile_pic,
            },
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
                // Do not send a response here, just log the error
              }

              // Send success response
              return res.status(200).json({ msg: "Shortlist updated successfully" });
            }
          );
        });
      });
    });
  });
};
exports.shortlistMaybeUser = (req, res) => {
  const user_id = req.userId; // Logged-in user ID
  const { shortlisted_user_id, status } = req.body;

  // Delete the entry from the user_maybe table
  const deleteUserMaybeQuery = `
    DELETE FROM user_maybe
    WHERE user_id = ? AND maybe_user_id = ?;
  `;

  conn.query(deleteUserMaybeQuery, [user_id, shortlisted_user_id], (err) => {
    if (err) {
      return res.status(500).json({ msg: "Database error", error: err });
    }

    // Proceed with the existing shortlist logic
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
              console.error("Error adding to message_listing:", err);
              // Do not send a response here, just log the error
            }
          });
        }

        // Fetch the full profile details of the logged-in user (who performed the shortlisting)
        const loggedInUserQuery = `
          SELECT * FROM profile_data
          WHERE user_id = ?;
        `;

        conn.query(loggedInUserQuery, [user_id], (err, loggedInUserResults) => {
          if (err) {
            console.error("Error fetching logged-in user profile details:", err);
            return res.status(500).json({ msg: "Database error", error: err });
          }

          if (loggedInUserResults.length === 0) {
            return res.status(404).json({ msg: "Logged-in user profile not found" });
          }

          const loggedInUser = loggedInUserResults[0];

          // Fetch the full profile details of the shortlisted user
          const profileQuery = `
            SELECT * FROM profile_data
            WHERE user_id = ?;
          `;

          conn.query(profileQuery, [shortlisted_user_id], (err, results) => {
            if (err) {
              console.error("Error fetching shortlisted user profile details:", err);
              return res.status(500).json({ msg: "Database error", error: err });
            }

            if (results.length === 0) {
              return res.status(404).json({ msg: "Shortlisted user profile not found" });
            }

            const shortlistedUser = results[0];

            // Create a notification message with details of both users
            const notificationMessage = JSON.stringify({
              message: `You have been shortlisted by ${loggedInUser.first_name} ${loggedInUser.last_name}`,
              shortlisted_by: {
                user_id: loggedInUser.user_id,
                first_name: loggedInUser.first_name,
                last_name: loggedInUser.last_name,
                profile_pic: loggedInUser.profile_pic,
              },
              shortlisted_user: {
                user_id: shortlistedUser.user_id,
                first_name: shortlistedUser.first_name,
                last_name: shortlistedUser.last_name,
                profile_pic: shortlistedUser.profile_pic,
              },
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
                  // Do not send a response here, just log the error
                }

                // Send success response
                return res.status(200).json({ msg: "Shortlist updated successfully" });
              }
            );
          });
        });
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
                  message: {
                      message: notification.message // Fallback to plain text
                  }
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