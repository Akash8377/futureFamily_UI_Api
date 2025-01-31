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
  } = req.headers;

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
          family_history_of_genetic_disorders, genetic_testing_results, reproductive_health,
          known_genetic_predispositions, hormonal_profile, energy_levels, diet, exercise_level,
          fertility_history, attachment_style, conflict_resolution_style, risk_tolerance,
          sense_of_humor, stress_handling, work_life_balance, social_preferences, 
          preferred_environment, importance_of_travel, want_children, number_of_children,
          parenting_style, career_goals, cultural_or_religious_beliefs, family_dynamics,
          relationship_with_parents, importance_of_family, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
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
    "SELECT * FROM profile_data WHERE user_id=" +
     req.userId;

  conn.query(sqlQuery, (err, result) => {
    if (err) {
      return res.status(500).send({
        msg: "Database error",
        error: err,
      });
    } else if (result.length === 0) {
      return res.status(404).send({
        msg: "User profile not found",
      });
    } else {
      res.status(200).send({
        status: "success",
        length: result.length,
        data: result,
      });
    }
  });
};

exports.update = (req, res) => {
  // Validate user input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Get user_id from JWT
  const user_id = req.userId; // Ensure authentication middleware populates this

  // Extract fields from request body
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
  } = req.headers;

  // Check if the user profile exists
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

      if (result.length === 0) {
        return res.status(404).json({
          status: "error",
          msg: "User profile not found",
        });
      }

      // Prepare dynamic update query
      const fields = [];
      const values = [];

      // Add fields dynamically if they exist in the request
      if (height !== undefined) {
        fields.push("height = ?");
        values.push(height);
      }
      if (weight !== undefined) {
        fields.push("weight = ?");
        values.push(weight);
      }
      if (body_type !== undefined) {
        fields.push("body_type = ?");
        values.push(body_type);
      }
      if (ethnicity !== undefined) {
        fields.push("ethnicity = ?");
        values.push(ethnicity);
      }
      if (eye_color !== undefined) {
        fields.push("eye_color = ?");
        values.push(eye_color);
      }
      if (hair_color !== undefined) {
        fields.push("hair_color = ?");
        values.push(hair_color);
      }
      if (blood_type !== undefined) {
        fields.push("blood_type = ?");
        values.push(blood_type);
      }
      if (family_history_of_genetic_disorders !== undefined) {
        fields.push("family_history_of_genetic_disorders = ?");
        values.push(family_history_of_genetic_disorders);
      }
      if (genetic_testing_results !== undefined) {
        fields.push("genetic_testing_results = ?");
        values.push(genetic_testing_results);
      }
      if (reproductive_health !== undefined) {
        fields.push("reproductive_health = ?");
        values.push(reproductive_health);
      }
      if (known_genetic_predispositions !== undefined) {
        fields.push("known_genetic_predispositions = ?");
        values.push(known_genetic_predispositions);
      }
      if (hormonal_profile !== undefined) {
        fields.push("hormonal_profile = ?");
        values.push(hormonal_profile);
      }
      if (energy_levels !== undefined) {
        fields.push("energy_levels = ?");
        values.push(energy_levels);
      }
      if (diet !== undefined) {
        fields.push("diet = ?");
        values.push(diet);
      }
      if (exercise_level !== undefined) {
        fields.push("exercise_level = ?");
        values.push(exercise_level);
      }
      if (fertility_history !== undefined) {
        fields.push("fertility_history = ?");
        values.push(fertility_history);
      }
      if (attachment_style !== undefined) {
        fields.push("attachment_style = ?");
        values.push(attachment_style);
      }
      if (conflict_resolution_style !== undefined) {
        fields.push("conflict_resolution_style = ?");
        values.push(conflict_resolution_style);
      }
      if (risk_tolerance !== undefined) {
        fields.push("risk_tolerance = ?");
        values.push(risk_tolerance);
      }
      if (sense_of_humor !== undefined) {
        fields.push("sense_of_humor = ?");
        values.push(sense_of_humor);
      }
      if (stress_handling !== undefined) {
        fields.push("stress_handling = ?");
        values.push(stress_handling);
      }
      if (work_life_balance !== undefined) {
        fields.push("work_life_balance = ?");
        values.push(work_life_balance);
      }
      if (social_preferences !== undefined) {
        fields.push("social_preferences = ?");
        values.push(social_preferences);
      }
      if (preferred_environment !== undefined) {
        fields.push("preferred_environment = ?");
        values.push(preferred_environment);
      }
      if (importance_of_travel !== undefined) {
        fields.push("importance_of_travel = ?");
        values.push(importance_of_travel);
      }
      if (want_children !== undefined) {
        fields.push("want_children = ?");
        values.push(want_children);
      }
      if (number_of_children !== undefined) {
        fields.push("number_of_children = ?");
        values.push(number_of_children);
      }
      if (parenting_style !== undefined) {
        fields.push("parenting_style = ?");
        values.push(parenting_style);
      }
      if (career_goals !== undefined) {
        fields.push("career_goals = ?");
        values.push(career_goals);
      }
      if (cultural_or_religious_beliefs !== undefined) {
        fields.push("cultural_or_religious_beliefs = ?");
        values.push(cultural_or_religious_beliefs);
      }
      if (family_dynamics !== undefined) {
        fields.push("family_dynamics = ?");
        values.push(family_dynamics);
      }
      if (relationship_with_parents !== undefined) {
        fields.push("relationship_with_parents = ?");
        values.push(relationship_with_parents);
      }
      if (importance_of_family !== undefined) {
        fields.push("importance_of_family = ?");
        values.push(importance_of_family);
      }

      // If no fields to update, return an error
      if (fields.length === 0) {
        return res.status(400).json({
          status: "error",
          msg: "No valid fields provided for update",
        });
      }

      // Add updated_at field
      fields.push("updated_at = ?");
      values.push(new Date());

      // Construct SQL query
      const query = `UPDATE profile_data SET ${fields.join(", ")} WHERE user_id = ?`;
      values.push(user_id);

      // Execute the update query
      conn.query(query, values, (updateErr, result) => {
        if (updateErr) {
          return res.status(500).json({
            msg: "Database error while updating user profile",
            error: updateErr,
          });
        }

        return res.status(200).json({
          status: "success",
          msg: "User profile updated successfully!",
        });
      });
    }
  );
};

