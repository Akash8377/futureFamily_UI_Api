const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const token_key = process.env.TOKEN_KEY;


exports.add_user_profile = (req, res) => {
  // Validate user input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Get user_id from JWT
  const user_id = req.userId; // Ensure req.userId is populated via authentication middleware

  const {
    height,
    weight,
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

  // Check if the user already has a profile
  conn.query(
    "SELECT id FROM profile_data WHERE user_id = ?",
    [user_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          msg: "Database error while checking user profile",
          error: err,
        });
      }

      if (result.length > 0) {
        return res.status(400).json({
          status: "error",
          msg: "User profile already exists",
        });
      }

      // Insert new user profile data if no existing record is found
      const query = `
        INSERT INTO profile_data 
          (user_id, height, weight, body_type, ethnicity, eye_color, hair_color, blood_type,
          family_history_of_genetic_disorders, genetic_testing_results,biological_attraction,psychological_compatibility
,birth_defects, reproductive_health,
          known_genetic_predispositions, hormonal_profile, energy_levels, diet, exercise_level,
          fertility_history, attachment_style, conflict_resolution_style, risk_tolerance,
          sense_of_humor, stress_handling, work_life_balance, social_preferences, 
          preferred_environment, importance_of_travel, want_children, number_of_children,
          parenting_style, career_goals, cultural_or_religious_beliefs, family_dynamics,
          relationship_with_parents, importance_of_family, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const values = [
        user_id,
        height,
        weight,
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
      ];

      conn.query(query, values, (insertErr, result) => {
        if (insertErr) {
          return res.status(500).json({
            msg: "Database error while inserting user profile",
            error: insertErr,
          });
        }

        return res.status(201).json({
          status: "success",
          msg: "User profile created successfully!",
          profile_id: result.insertId,
        });
      });
    }
  );
};



exports.edit = (req, res) => {
  const sqlQuery =
    `SELECT u.*, p.* FROM users u
     LEFT JOIN profile_data p ON u.id = p.user_id
     WHERE u.id = ${req.userId}`;

  conn.query(sqlQuery, (err, result) => {
    if (err) {
      return res.status(500).send({
        msg: "Database error",
        error: err,
      });
    } else if (result.length === 0) {
      return res.status(404).send({
        msg: "User not found",
      });
    } else {
      // Check if the user has no profile data
      if (result[0].id && !result[0].user_id) {
        // Send only user data if no profile exists
        res.status(200).send({
          status: "success",
          length: result.length,
          data: result.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            // Add other fields from the users table
          })),
        });
      } else {
        // Send both user and profile data if profile exists
        res.status(200).send({
          status: "success",
          length: result.length,
          data: result,
        });
      }
    }
  });
};


exports.update = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const user_id = req.userId; // Extract user ID from JWT

  const {
    first_name,
    last_name,
    dob,
    screen_name,
    city_of_residence,
    region_of_residence,
    profile_pic,
    dna,
    gender,
    looking_for, // New fields
    height,
    weight,
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
  } = req.body; // Use `req.body` instead of `req.headers`

  if (!user_id) {
    return res.status(401).json({ status: "error", msg: "User ID missing" });
  }

  // Step 1: Update `users` table
  const userFields = [];
  const userValues = [];

  const userFieldMap = {
    first_name,
    last_name,
    dob,
    screen_name,
    city_of_residence,
    region_of_residence,
    profile_pic,
    dna,
    gender,
    looking_for, // Added new fields
  };

  Object.entries(userFieldMap).forEach(([key, value]) => {
    if (value !== undefined) {
      userFields.push(`${key} = ?`);
      userValues.push(value);
    }
  });

  if (userFields.length > 0) {
    userValues.push(user_id); // Add user_id for WHERE condition

    const userUpdateQuery = `UPDATE users SET ${userFields.join(", ")} WHERE id = ?`;
    conn.query(userUpdateQuery, userValues, (userErr) => {
      if (userErr) {
        return res.status(500).json({
          msg: "Database error while updating user details",
          error: userErr,
        });
      }
    });
  }

  // Step 2: Check if the user has an existing profile in `profile_data`
  conn.query(
    "SELECT id FROM profile_data WHERE user_id = ?",
    [user_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          msg: "Database error while checking user profile",
          error: err,
        });
      }

      // Prepare data for update or insert
      const profileFields = [];
      const profileValues = [];

      const profileFieldMap = {
        height,
        weight,
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
      };

      Object.entries(profileFieldMap).forEach(([key, value]) => {
        if (value !== undefined) {
          profileFields.push(`${key} = ?`);
          profileValues.push(value);
        }
      });

      if (profileFields.length === 0 && userFields.length === 0) {
        return res.status(400).json({
          status: "error",
          msg: "No valid fields provided for update",
        });
      }

      if (result.length > 0) {
        // Profile exists -> Update
        profileFields.push("updated_at = ?");
        profileValues.push(new Date());
        profileValues.push(user_id); // WHERE condition

        const profileUpdateQuery = `UPDATE profile_data SET ${profileFields.join(", ")} WHERE user_id = ?`;
        conn.query(profileUpdateQuery, profileValues, (updateErr) => {
          if (updateErr) {
            return res.status(500).json({
              msg: "Database error while updating profile",
              error: updateErr,
            });
          }
          return res.status(200).json({
            status: "success",
            msg: "User profile updated successfully!",
          });
        });
      } else {
        // Profile does NOT exist -> Insert
        const profileInsertFields = [...Object.keys(profileFieldMap), "user_id", "created_at", "updated_at"];
        const profileInsertValues = [...Object.values(profileFieldMap), user_id, new Date(), new Date()];

        const profileInsertQuery = `INSERT INTO profile_data (${profileInsertFields.join(", ")}) VALUES (${profileInsertFields.map(() => "?").join(", ")})`;
        conn.query(profileInsertQuery, profileInsertValues, (insertErr) => {
          if (insertErr) {
            return res.status(500).json({
              msg: "Database error while creating profile",
              error: insertErr,
            });
          }
          return res.status(201).json({
            status: "success",
            msg: "User profile created successfully!",
          });
        });
      }
    }
  );
};




