const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const token_key = process.env.TOKEN_KEY;
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

exports.filter_users = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ errors: errors.array() });
  }

  const user_id = req.userId;
  if (!user_id) {
    return res.status(401).json({ msg: "Unauthorized: User ID missing from token" });
  }

  // Fetch logged-in user's profile
  conn.query(
    `SELECT * FROM profile_data JOIN users ON profile_data.user_id = users.id WHERE user_id = ?`,
    [user_id],
    (err, loggedInUserData) => {
      if (err || loggedInUserData.length === 0) {
        return res.status(500).json({ msg: "Error fetching logged-in user profile" });
      }

      const loggedInUser = loggedInUserData[0];
      let { gender, looking_for } = loggedInUser;

      // Convert `looking_for` to an array
      let lookingForArray = [];
      if (typeof looking_for === "string") {
        lookingForArray = looking_for.split(",").map(Number);
      } else if (typeof looking_for === "number") {
        lookingForArray = [looking_for];
      }

      if (lookingForArray.length === 0) {
        return res.status(400).json({ msg: "Invalid looking_for value" });
      }

      let query = `
        SELECT profile_data.*, users.dob, users.gender,region_of_residence, users.looking_for,
        users.first_name, users.last_name, users.profile_pic, users.dna, users.personality_type,
        TIMESTAMPDIFF(YEAR, users.dob, CURDATE()) AS age,
        COALESCE(user_shortlisted.status, 0) AS shortlist_status
        FROM profile_data
        JOIN users ON profile_data.user_id = users.id
        LEFT JOIN user_shortlisted 
            ON user_shortlisted.user_id = ? 
            AND user_shortlisted.shortlisted_user_id = users.id
        WHERE users.id != ? 
        AND users.gender IN (?) 
        AND (user_shortlisted.status IS NULL OR user_shortlisted.status NOT IN (1, 2))
        AND NOT EXISTS (
          SELECT 1
          FROM user_maybe
          WHERE user_maybe.user_id = ?
            AND user_maybe.maybe_user_id = users.id
            AND user_maybe.status = 3
        )`;

      let queryParams = [user_id, user_id, lookingForArray, user_id];

      // Extract filter parameters
      const lastFilterData = JSON.stringify(req.query);

      // Update last_filter column in users table
      conn.query(
        `UPDATE users SET last_filter = ? WHERE id = ?`,
        [lastFilterData, user_id],
        (updateErr) => {
          if (updateErr) {
            // console.error("Error updating last filter:", updateErr);
          } else {
            // console.log("Last filter updated successfully:", lastFilterData);
          }
        }
      );

      // Apply dynamic filters (explicit conditions)
      const {
        region_of_residence,
        min_height,
        max_height,
        min_weight,
        max_weight,
        body_type,
        ethnicity,
        eye_color,
        hair_color,
        blood_type,
        family_history_of_genetic_disorders,
        genetic_testing_results,
        biological_attraction,
        psychological_compatibility,
        birth_defects,
        reproductive_health,
        known_genetic_predispositions,
        hormonal_profile,
        energy_levels,
        diet,
        exercise_level,
        fertility_history,
        attachment_style,
        conflict_resolution_style,
        risk_tolerance,
        sense_of_humor,
        stress_handling,
        work_life_balance,
        social_preferences,
        preferred_environment,
        importance_of_travel,
        want_children,
        number_of_children,
        parenting_style,
        career_goals,
        cultural_or_religious_beliefs,
        family_dynamics,
        relationship_with_parents,
        importance_of_family,
      } = req.body;

      if (min_height) {
        query += ` AND height >= ?`;
        queryParams.push(min_height);
      }
      if (max_height) {
        query += ` AND height <= ?`;
        queryParams.push(max_height);
      }
      if (min_weight) {
        query += ` AND weight >= ?`;
        queryParams.push(min_weight);
      }
      if (max_weight) {
        query += ` AND weight <= ?`;
        queryParams.push(max_weight);
      }

      if (body_type) {
        let body_typeArray = body_type.split(",").map((color) => color.trim());
        query += ` AND body_type IN (?)`;
        queryParams.push(body_typeArray);
      }
      if (importance_of_family) {
        let importance_of_familyArray = importance_of_family.split(",").map((color) => color.trim());
        query += ` AND importance_of_family IN (?)`;
        queryParams.push(importance_of_familyArray);
      }
      if (biological_attraction) {
        let biological_attractionArray = biological_attraction.split(",").map((color) => color.trim());
        query += ` AND biological_attraction IN (?)`;
        queryParams.push(biological_attractionArray);
      }
      if (psychological_compatibility) {
        let psychological_compatibilityArray = psychological_compatibility.split(",").map((color) => color.trim());
        query += ` AND psychological_compatibility IN (?)`;
        queryParams.push(psychological_compatibilityArray);
      }
      if (birth_defects) {
        let birth_defectsArray = birth_defects.split(",").map((color) => color.trim());
        query += ` AND birth_defects IN (?)`;
        queryParams.push(birth_defectsArray);
      }
    
      if (ethnicity) {
        let ethnicityArray = ethnicity.split(",").map((color) => color.trim());
        query += ` AND ethnicity IN (?)`;
        queryParams.push(ethnicityArray);
      }
      if (eye_color) {
        let eyeColorsArray = eye_color.split(",").map((color) => color.trim());
        query += ` AND eye_color IN (?)`;
        queryParams.push(eyeColorsArray);
      }
      if (hair_color) {
        let hairColorsArray = hair_color
          .split(",")
          .map((color) => color.trim());
        query += ` AND hair_color IN (?)`;
        queryParams.push(hairColorsArray);
      }
      if (blood_type) {
        query += ` AND blood_type = ?`;
        queryParams.push(blood_type);
      }
      if (family_history_of_genetic_disorders) {
        query += ` AND family_history_of_genetic_disorders = ?`;
        queryParams.push(family_history_of_genetic_disorders);
      }
      if (genetic_testing_results) {
        query += ` AND genetic_testing_results = ?`;
        queryParams.push(genetic_testing_results);
      }
      if (genetic_testing_results) {
        query += ` AND genetic_testing_results = ?`;
        queryParams.push(genetic_testing_results);
      }
      if (genetic_testing_results) {
        query += ` AND genetic_testing_results = ?`;
        queryParams.push(genetic_testing_results);
      }
      
      if (biological_attraction) {
        query += ` AND biological_attraction = ?`;
        queryParams.push(biological_attraction);
      }
    
      if (psychological_compatibility) {
        query += ` AND psychological_compatibility = ?`;
        queryParams.push(psychological_compatibility);
      }
      if (birth_defects) {
        query += ` AND birth_defects = ?`;
        queryParams.push(birth_defects);
      }
      if (reproductive_health) {
        query += ` AND reproductive_health = ?`;
        queryParams.push(reproductive_health);
      }
      if (known_genetic_predispositions) {
        query += ` AND known_genetic_predispositions = ?`;
        queryParams.push(known_genetic_predispositions);
      }
      if (hormonal_profile) {
        query += ` AND hormonal_profile = ?`;
        queryParams.push(hormonal_profile);
      }
      if (energy_levels) {
        query += ` AND energy_levels = ?`;
        queryParams.push(energy_levels);
      }
      if (diet) {
        query += ` AND diet = ?`;
        queryParams.push(diet);
      }
      if (exercise_level) {
        query += ` AND exercise_level = ?`;
        queryParams.push(exercise_level);
      }
      if (fertility_history) {
        query += ` AND fertility_history = ?`;
        queryParams.push(fertility_history);
      }
      if (attachment_style) {
        query += ` AND attachment_style = ?`;
        queryParams.push(attachment_style);
      }
      if (conflict_resolution_style) {
        query += ` AND conflict_resolution_style = ?`;
        queryParams.push(conflict_resolution_style);
      }
      if (risk_tolerance) {
        query += ` AND risk_tolerance = ?`;
        queryParams.push(risk_tolerance);
      }
      if (sense_of_humor) {
        query += ` AND sense_of_humor = ?`;
        queryParams.push(sense_of_humor);
      }
      if (stress_handling) {
        query += ` AND stress_handling = ?`;
        queryParams.push(stress_handling);
      }
      if (work_life_balance) {
        query += ` AND work_life_balance = ?`;
        queryParams.push(work_life_balance);
      }
      if (social_preferences) {
        query += ` AND social_preferences = ?`;
        queryParams.push(social_preferences);
      }

      if (preferred_environment) {
        let preferred_environmentColorsArray = preferred_environment
          .split(",")
          .map((color) => color.trim());
        query += ` AND preferred_environment IN (?)`;
        queryParams.push(preferred_environmentColorsArray);
      }
      if (importance_of_travel) {
        query += ` AND importance_of_travel = ?`;
        queryParams.push(importance_of_travel);
      }
      if (want_children) {
        query += ` AND want_children = ?`;
        queryParams.push(want_children);
      }
      if (number_of_children) {
        query += ` AND number_of_children = ?`;
        queryParams.push(number_of_children);
      }
      if (parenting_style) {
        query += ` AND parenting_style = ?`;
        queryParams.push(parenting_style);
      }
      if (career_goals) {
        query += ` AND career_goals = ?`;
        queryParams.push(career_goals);
      }

      // Execute the query to fetch filtered users
      conn.query(query, queryParams, (err, results) => {
        if (err) {
          return res
            .status(500)
            .send({ msg: "Database error while filtering users", error: err });
        }

        // Calculate match percentage for each user
        const matchedUsers = results.map((userB) => ({
          ...userB,
          match_percentage: calculateMatchPercentage(loggedInUser, userB),
        }));

        // Sort users by highest match percentage
        matchedUsers.sort((a, b) => b.match_percentage - a.match_percentage);

        return res.status(200).send({
          status: "success",
          users: matchedUsers,
        });
      });
    }
  );
};

// Function to calculate match percentage
const calculateMatchPercentage = (userA, userB) => {
  let matchScore = 0;
  let totalWeight = 0;

  // Personal Information (48%)
  const personalInfoWeights = {
    height: 0.1,
    weight: 0.1,
    body_type: 0.2,
    ethnicity: 0.1,
    eye_color: 0.09,
    hair_color: 0.09,
  };

  if (userA.height === userB.height)
    matchScore += personalInfoWeights.height * 48;
  if (userA.weight === userB.weight)
    matchScore += personalInfoWeights.weight * 48;
  if (userA.body_type === userB.body_type)
    matchScore += personalInfoWeights.body_type * 48;
  if (userA.ethnicity === userB.ethnicity)
    matchScore += personalInfoWeights.ethnicity * 48;
  if (userA.eye_color === userB.eye_color)
    matchScore += personalInfoWeights.eye_color * 48;
  if (userA.hair_color === userB.hair_color)
    matchScore += personalInfoWeights.hair_color * 48;
  totalWeight += 48;

  // Genetic and Health Information (5%)
  const geneticWeights = {
    blood_type: 0.25,
    family_history: 0.25,
    genetic_testing: 0.25,
    reproductive_health: 0.25,
  };

  if (userA.blood_type === userB.blood_type)
    matchScore += geneticWeights.blood_type * 5;
  if (
    userA.family_history_of_genetic_disorders ===
    userB.family_history_of_genetic_disorders
  )
    matchScore += geneticWeights.family_history * 5;
  if (userA.genetic_testing_results === userB.genetic_testing_results)
    matchScore += geneticWeights.genetic_testing * 5;
  if (userA.reproductive_health === userB.reproductive_health)
    matchScore += geneticWeights.reproductive_health * 5;
  totalWeight += 5;

  // Biochemical and Physiological Factors (15%)
  const bioWeights = { energy_levels: 0.33, diet: 0.33, exercise_level: 0.34 };

  if (userA.energy_levels === userB.energy_levels)
    matchScore += bioWeights.energy_levels * 15;
  if (userA.diet === userB.diet) matchScore += bioWeights.diet * 15;
  if (userA.exercise_level === userB.exercise_level)
    matchScore += bioWeights.exercise_level * 15;
  totalWeight += 15;

  // Psychological Traits (10%)
  const psychologyWeights = {
    attachment_style: 0.2,
    conflict_resolution: 0.2,
    risk_tolerance: 0.2,
    humor: 0.2,
    stress_handling: 0.2,
  };

  if (userA.attachment_style === userB.attachment_style)
    matchScore += psychologyWeights.attachment_style * 10;
  if (userA.conflict_resolution_style === userB.conflict_resolution_style)
    matchScore += psychologyWeights.conflict_resolution * 10;
  if (userA.risk_tolerance === userB.risk_tolerance)
    matchScore += psychologyWeights.risk_tolerance * 10;
  if (userA.sense_of_humor === userB.sense_of_humor)
    matchScore += psychologyWeights.humor * 10;
  if (userA.stress_handling === userB.stress_handling)
    matchScore += psychologyWeights.stress_handling * 10;
  totalWeight += 10;

  // Lifestyle (8%)
  const lifestyleWeights = {
    work_life_balance: 0.25,
    social_preferences: 0.25,
    environment: 0.25,
    travel: 0.25,
  };

  if (userA.work_life_balance === userB.work_life_balance)
    matchScore += lifestyleWeights.work_life_balance * 8;
  if (userA.social_preferences === userB.social_preferences)
    matchScore += lifestyleWeights.social_preferences * 8;
  if (userA.preferred_environment === userB.preferred_environment)
    matchScore += lifestyleWeights.environment * 8;
  if (userA.importance_of_travel === userB.importance_of_travel)
    matchScore += lifestyleWeights.travel * 8;
  totalWeight += 8;

  // Values and Long-Term Goals (8%)
  const valuesWeights = {
    children: 0.25,
    num_children: 0.25,
    parenting: 0.25,
    career_goals: 0.25,
  };

  if (userA.want_children === userB.want_children)
    matchScore += valuesWeights.children * 8;
  if (userA.number_of_children === userB.number_of_children)
    matchScore += valuesWeights.num_children * 8;
  if (userA.parenting_style === userB.parenting_style)
    matchScore += valuesWeights.parenting * 8;
  if (userA.career_goals === userB.career_goals)
    matchScore += valuesWeights.career_goals * 8;
  totalWeight += 8;

  // Family and Upbringing (8%)
  const familyWeights = {
    family_dynamics: 0.33,
    relationship_parents: 0.33,
    importance_family: 0.34,
  };

  if (userA.family_dynamics === userB.family_dynamics)
    matchScore += familyWeights.family_dynamics * 8;
  if (userA.relationship_with_parents === userB.relationship_with_parents)
    matchScore += familyWeights.relationship_parents * 8;
  if (userA.importance_of_family === userB.importance_of_family)
    matchScore += familyWeights.importance_family * 8;
  totalWeight += 8;

  // Calculate final match percentage
  const matchPercentage = (matchScore / totalWeight) * 100;
  return matchPercentage.toFixed(2);
};

exports.apply_last_filter = (req, res) => {
  // Get user ID from JWT (set in authentication middleware)
  const user_id = req.userId;
  if (!user_id) {
    return res
      .status(401)
      .json({ msg: "Unauthorized: User ID missing from token" });
  }

  // Fetch the last stored filter from the users table
  conn.query(
    `SELECT last_filter FROM users WHERE id = ?`,
    [user_id],
    (err, result) => {
      if (err || result.length === 0) {
        return res.status(500).json({ msg: "Error retrieving last filter" });
      }

      // Parse the last filter JSON
      let lastFilter = {};
      try {
        lastFilter = JSON.parse(result[0].last_filter || "{}");
      } catch (parseErr) {
        return res
          .status(500)
          .json({ msg: "Error parsing last filter", error: parseErr });
      }

      // Assign last filter values to req.query and call filter_users
      req.query = lastFilter;
      exports.filter_users(req, res);
    }
  );
};

const getUserDetailsWithMatch = (loggedInUser, targetUserId, callback) => {
  // Fetch the target user's profile
  conn.query(
    `SELECT profile_data.*, users.dob, users.gender, users.looking_for, 
    users.first_name, users.last_name,region_of_residence, users.profile_pic, users.dna, users.personality_type,
    TIMESTAMPDIFF(YEAR, users.dob, CURDATE()) AS age
    FROM profile_data
    JOIN users ON profile_data.user_id = users.id
    WHERE users.id = ?`,
    [targetUserId],
    (err, targetUserData) => {
      if (err || targetUserData.length === 0) {
        return callback(
          { msg: "User not found or database error", error: err },
          null
        );
      }

      const targetUser = targetUserData[0];

      // Calculate match percentage
      const matchPercentage = calculateMatchPercentage(
        loggedInUser,
        targetUser
      );

      return callback(null, {
        ...targetUser,
        match_percentage: matchPercentage,
      });
    }
  );
};

exports.get_user_details = (req, res) => {
  const user_id = req.userId; // Logged-in user
  const targetUserId = req.params.userId; // Target user from URL

  if (!user_id) {
    return res
      .status(401)
      .json({ msg: "Unauthorized: User ID missing from token" });
  }

  // Fetch logged-in user data
  conn.query(
    `SELECT * FROM profile_data JOIN users ON profile_data.user_id = users.id WHERE user_id = ?`,
    [user_id],
    (err, loggedInUserData) => {
      if (err || loggedInUserData.length === 0) {
        return res
          .status(500)
          .json({ msg: "Error fetching logged-in user profile" });
      }

      const loggedInUser = loggedInUserData[0];

      // Fetch target user details and calculate match percentage
      getUserDetailsWithMatch(
        loggedInUser,
        targetUserId,
        (error, userDetails) => {
          if (error) {
            return res.status(500).json(error);
          }

          return res.status(200).json({
            status: "success",
            user: userDetails,
          });
        }
      );
    }
  );
};

exports.getShortlistedUsers = (req, res) => {
  const user_id = req.userId;

  const query = `
    SELECT 
      user_shortlisted.shortlisted_user_id,
      users.first_name,
      users.last_name,
      users.region_of_residence,
      users.profile_pic,
      users.dob,
      users.gender,
      users.personality_type
    FROM user_shortlisted
    JOIN users ON user_shortlisted.shortlisted_user_id = users.id
    WHERE user_shortlisted.user_id = ? 
      AND user_shortlisted.status = 1
      AND NOT EXISTS (
        SELECT 1
        FROM user_shortlisted us2
        WHERE us2.user_id = user_shortlisted.shortlisted_user_id
          AND us2.shortlisted_user_id = user_shortlisted.user_id
          AND us2.status = 1
      )
      AND NOT EXISTS (
        SELECT 1
        FROM user_maybe
        WHERE user_maybe.user_id = user_shortlisted.user_id
          AND user_maybe.maybe_user_id = user_shortlisted.shortlisted_user_id
          AND user_maybe.status = 3
      );
  `;

  conn.query(query, [user_id], (err, results) => {
    if (err) {
      return res.status(500).json({ msg: "Database error", error: err });
    }

    if (results.length === 0) {
      return res
        .status(200)
        .json({ msg: "No shortlisted users found", users: [] });
    }

    // Extract shortlisted user IDs
    const shortlistedUserIds = results.map((user) => user.shortlisted_user_id);

    // Fetch details of all shortlisted users
    getMultipleUserDetails(user_id, shortlistedUserIds, (error, users) => {
      if (error) {
        return res
          .status(500)
          .json({ msg: "Error fetching shortlisted user details", error });
      }

      // Combine the fetched user details with the additional fields
      const usersWithDetails = users.map(user => {
        const shortlistedUser = results.find(shortlisted => shortlisted.shortlisted_user_id === user.user_id);
        return {
          ...user,
          full_name: shortlistedUser.first_name + " " + shortlistedUser.last_name,
          region_of_residence: shortlistedUser.region_of_residence,
          profile_pic: shortlistedUser.profile_pic,
          age: calculateAge(shortlistedUser.dob), // Calculate age from DOB
          gender: shortlistedUser.gender,
          personality_type: shortlistedUser.personality_type
        };
      });

      res.status(200).json({ msg: "Shortlisted users fetched", users: usersWithDetails });
    });
  });
};
exports.getNotificationsUsers = (req, res) => {
  const user_id = req.userId;

  const query = `
    SELECT 
      notifications.notifications_user_id,
      users.first_name,
      users.last_name,
      users.region_of_residence,
      users.profile_pic,
      users.dob,
      users.gender,
      users.personality_type
    FROM notifications
    JOIN users ON notifications.notifications_user_id = users.id
    WHERE notifications.user_id = ?
      AND NOT EXISTS (
        SELECT 1
        FROM user_shortlisted us1
        JOIN user_shortlisted us2
          ON us1.user_id = us2.shortlisted_user_id
          AND us1.shortlisted_user_id = us2.user_id
        WHERE us1.user_id = notifications.user_id
          AND us1.shortlisted_user_id = notifications.notifications_user_id
          AND us1.status = 1
          AND us2.status = 1
      );
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

      // Combine the fetched user details with the additional fields
      const usersWithDetails = users.map(user => {
        const notificationUser = results.find(notification => notification.notifications_user_id === user.user_id);
        return {
          ...user,
          full_name: notificationUser.first_name + " " + notificationUser.last_name,
          region_of_residence: notificationUser.region_of_residence,
          profile_pic: notificationUser.profile_pic,
          age: calculateAge(notificationUser.dob), // Calculate age from DOB
          gender: notificationUser.gender,
          personality_type: notificationUser.personality_type
        };
      });

      res.status(200).json({ msg: "Notifications users fetched", users: usersWithDetails });
    });
  });
};
exports.getMaybeUsers = (req, res) => {
  const user_id = req.userId;

  const query = `
    SELECT 
      user_maybe.maybe_user_id,
      users.first_name,
      users.last_name,
      users.region_of_residence,
      users.profile_pic,
      users.dob,
      users.gender,
      users.personality_type,
      user_maybe.status,
      user_maybe.created_at,
      user_maybe.updated_at
    FROM user_maybe
    JOIN users ON user_maybe.maybe_user_id = users.id
    WHERE user_maybe.user_id = ? 
      AND user_maybe.status = 3
      AND NOT EXISTS (
        SELECT 1
        FROM user_shortlisted
        WHERE user_shortlisted.user_id = user_maybe.user_id
          AND user_shortlisted.shortlisted_user_id = user_maybe.maybe_user_id
          AND user_shortlisted.status = 1
      );
  `;

  conn.query(query, [user_id], (err, results) => {
    if (err) {
      return res.status(500).json({ msg: "Database error", error: err });
    }

    if (results.length === 0) {
      return res
        .status(200)
        .json({ msg: "No maybe users found with status 3 (excluding shortlisted users)", users: [] });
    }

    // Extract maybe user IDs
    const maybeUserIds = results.map((user) => user.maybe_user_id);

    // Fetch details of all maybe users
    getMultipleUserDetails(user_id, maybeUserIds, (error, users) => {
      if (error) {
        return res
          .status(500)
          .json({ msg: "Error fetching maybe user details", error });
      }

      // Combine the fetched user details with the additional fields
      const usersWithDetails = results.map((maybeUser) => {
        const userDetails = users.find((user) => user.user_id === maybeUser.maybe_user_id);
        return {
          ...userDetails,
          full_name: maybeUser.first_name + " " + maybeUser.last_name,
          region_of_residence: maybeUser.region_of_residence,
          profile_pic: maybeUser.profile_pic,
          age: calculateAge(maybeUser.dob), // Calculate age from DOB
          personality_type: maybeUser.personality_type,
          gender: maybeUser.gender,
          status: maybeUser.status,
          created_at: maybeUser.created_at,
          updated_at: maybeUser.updated_at
        };
      });

      res.status(200).json({ msg: "Maybe users with status 3 (excluding shortlisted users) fetched", users: usersWithDetails });
    });
  });
};
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

