const conn = require("../services/db");

exports.getMessageListing = (req, res) => {
  const user_id = req.userId; 

  
  const query = `
    SELECT 
      us1.shortlisted_user_id AS user_id,
      users.first_name,
      users.last_name,
      users.profile_pic,
      users.dob,
      users.gender,
      users.online,
      users.last_seen,
      users.personality_type,
      last_message.message AS last_message,
      last_message.created_at AS last_message_time
    FROM user_shortlisted us1
    JOIN user_shortlisted us2 
      ON us1.user_id = us2.shortlisted_user_id 
      AND us1.shortlisted_user_id = us2.user_id
    JOIN users ON us1.shortlisted_user_id = users.id
    LEFT JOIN (
      SELECT 
        sender_id,
        receiver_id,
        message,
        created_at,
        ROW_NUMBER() OVER (PARTITION BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id) 
        ORDER BY created_at DESC
      ) AS rn
      FROM messages
    ) AS last_message
    ON (us1.shortlisted_user_id = last_message.sender_id AND us1.user_id = last_message.receiver_id)
    OR (us1.shortlisted_user_id = last_message.receiver_id AND us1.user_id = last_message.sender_id)
    WHERE us1.user_id = ? 
      AND us1.status = 1 
      AND us2.status = 1
      AND (last_message.rn = 1 OR last_message.rn IS NULL);
  `;

  conn.query(query, [user_id], (err, results) => {
    if (err) {
      return res.status(500).json({ msg: "Database error", error: err });
    }

    if (results.length === 0) {
      return res.status(200).json({ msg: "No mutual shortlisted users found", users: [] });
    }

    // Extract user IDs
    const userIds = results.map(user => user.user_id);

    // Fetch details of all mutual shortlisted users
    getMultipleUserDetails(user_id, userIds, (error, users) => {
      if (error) {
        return res.status(500).json({ msg: "Error fetching user details", error });
      }

      // Combine the fetched user details with the additional fields
      const usersWithDetails = users.map(user => {
        const mutualUser = results.find(mutual => mutual.user_id === user.user_id);
        return {
          ...user,
          full_name: mutualUser.first_name + " " + mutualUser.last_name,
          online: mutualUser.online,
          last_seen: mutualUser.last_seen,
          profile_pic: mutualUser.profile_pic,
          age: calculateAge(mutualUser.dob), // Calculate age from DOB
          gender: mutualUser.gender,
          personality_type: mutualUser.personality_type,
          last_message: mutualUser.last_message || null, // Last message
          last_message_time: mutualUser.last_message_time || null // Last message time
        };
      });

      res.status(200).json({ msg: "Mutual shortlisted users fetched", users: usersWithDetails });
    });
  });
};

// Helper function to calculate age
const calculateAge = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

// Helper function to fetch multiple user details
const getMultipleUserDetails = (loggedInUserId, userIds, callback) => {
  if (userIds.length === 0) {
    return callback(null, []);
  }

  const query = `
    SELECT * FROM profile_data
    WHERE user_id IN (?);
  `;

  conn.query(query, [userIds], (err, results) => {
    if (err) {
      return callback(err);
    }

    // Add match percentage or other custom logic if needed
    const users = results.map(user => ({
      ...user,
      matchPercentage: calculateMatchPercentage(loggedInUserId, user.user_id) // Optional
    }));

    callback(null, users);
  });
};

// Helper function to calculate match percentage (if needed)
const calculateMatchPercentage = (userA, userB) => {
  // Implement your match percentage calculation logic here
  return 0; // Placeholder
};