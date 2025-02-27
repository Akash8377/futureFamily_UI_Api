exports.getNotificationsUsers = (req, res) => {
    const user_id = req.userId;
  
    const query = `
    SELECT notifications_user_id
    FROM notifications 
    WHERE user_id = ?;
  `;
  
    conn.query(query, [user_id], (err, results) => {
      if (err) {
        return res.status(500).json({ msg: "Database error", error: err });
      }
  
      if (results.length === 0) {
        return res
          .status(200)
          .json({ msg: "No notifications users found", users: [] });
      }
  
      // Extract notifications user IDs
      const notificationsUserIds = results.map((user) => user.notifications_user_id);
  
      // Fetch details of all notifications users
      getMultipleUserDetails(user_id, notificationsUserIds, (error, users) => {
        if (error) {
          return res
            .status(500)
            .json({ msg: "Error fetching notifications user details", error });
        }
  
        res.status(200).json({ msg: "Notifications users fetched", users });
      });
    });
  };