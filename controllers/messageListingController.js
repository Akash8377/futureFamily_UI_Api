const conn = require("../services/db");

exports.getMessageListing = (req, res) => {
  const user_id = req.userId; // Logged-in user ID

  // Query to find users who have mutually shortlisted each other
  const query = `
    SELECT 
      us1.shortlisted_user_id AS user_id,
      users.first_name,
      users.last_name,
      users.profile_pic,
      users.dob,
      users.gender,
      users.personality_type
    FROM user_shortlisted us1
    JOIN user_shortlisted us2 
      ON us1.user_id = us2.shortlisted_user_id 
      AND us1.shortlisted_user_id = us2.user_id
    JOIN users ON us1.shortlisted_user_id = users.id
    WHERE us1.user_id = ? 
      AND us1.status = 1 
      AND us2.status = 1;
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
          profile_pic: mutualUser.profile_pic,
          age: calculateAge(mutualUser.dob), // Calculate age from DOB
          gender: mutualUser.gender,
          personality_type: mutualUser.personality_type
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