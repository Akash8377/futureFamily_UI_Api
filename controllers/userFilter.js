const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const token_key = process.env.TOKEN_KEY;



exports.filter_users = (req, res) => {
  // Validate input parameters
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ errors: errors.array() });
  }

  // Extract filter parameters from the request
  const {
    min_age,
    max_age,
    min_height,
    max_height,
    min_weight,
    max_weight,
    education_level,
    languages,
    religion,
    employment_status,
    occupation,
    income,
    relationship_type,
    alcohol_usage,
    smoking_tobacco,
    smoking_weed,
    personal_interests,
    kinks,
    western_zodiac,
    eastern_zodiac,
    movie_preferences,
    music_preferences,
    pets,
    allergies,
    disabilities,
    vaccinated,
    blood_type,
    eye_color,
    hair_color,
    hair_curl,
    latitude,
    longitude,
    distance, // in km
  } = req.query;

  // Start building the SQL query
  let query = `
    SELECT user_profiles.*, users.dob, 
    TIMESTAMPDIFF(YEAR, users.dob, CURDATE()) AS age
    FROM user_profiles 
    JOIN users ON user_profiles.user_id = users.id
    WHERE 1=1
  `;

  if (min_age && max_age) {
    query += ` AND TIMESTAMPDIFF(YEAR, users.dob, CURDATE()) BETWEEN ${conn.escape(min_age)} AND ${conn.escape(max_age)}`;
  }
  if (min_height) query += ` AND height >= ${conn.escape(min_height)}`;
  if (max_height) query += ` AND height <= ${conn.escape(max_height)}`;
  if (min_weight) query += ` AND weight >= ${conn.escape(min_weight)}`;
  if (max_weight) query += ` AND weight <= ${conn.escape(max_weight)}`;
  if (education_level) query += ` AND education_level = ${conn.escape(education_level)}`;
  if (languages) query += ` AND languages LIKE ${conn.escape(`%${languages}%`)}`;
  if (religion) query += ` AND religion = ${conn.escape(religion)}`;
  if (employment_status) query += ` AND employment_status = ${conn.escape(employment_status)}`;
  if (occupation) query += ` AND occupation LIKE ${conn.escape(`%${occupation}%`)}`;
  if (income) query += ` AND income = ${conn.escape(income)}`;
  if (relationship_type) query += ` AND relationship_type = ${conn.escape(relationship_type)}`;
  if (alcohol_usage) query += ` AND alcohol_usage = ${conn.escape(alcohol_usage)}`;
  if (smoking_tobacco) query += ` AND smoking_tobacco = ${conn.escape(smoking_tobacco)}`;
  if (smoking_weed) query += ` AND smoking_weed = ${conn.escape(smoking_weed)}`;
  if (personal_interests) query += ` AND personal_interests LIKE ${conn.escape(`%${personal_interests}%`)}`;
  if (kinks) query += ` AND kinks LIKE ${conn.escape(`%${kinks}%`)}`;
  if (western_zodiac) query += ` AND western_zodiac = ${conn.escape(western_zodiac)}`;
  if (eastern_zodiac) query += ` AND eastern_zodiac = ${conn.escape(eastern_zodiac)}`;
  if (movie_preferences) query += ` AND movie_preferences LIKE ${conn.escape(`%${movie_preferences}%`)}`;
  if (music_preferences) query += ` AND music_preferences LIKE ${conn.escape(`%${music_preferences}%`)}`;
  if (pets) query += ` AND pets LIKE ${conn.escape(`%${pets}%`)}`;
  if (allergies) query += ` AND allergies LIKE ${conn.escape(`%${allergies}%`)}`;
  if (disabilities) query += ` AND disabilities LIKE ${conn.escape(`%${disabilities}%`)}`;
  if (vaccinated) query += ` AND vaccinated = ${conn.escape(vaccinated)}`;
  if (blood_type) query += ` AND blood_type = ${conn.escape(blood_type)}`;
  if (eye_color) query += ` AND eye_color = ${conn.escape(eye_color)}`;
  if (hair_color) query += ` AND hair_color = ${conn.escape(hair_color)}`;
  if (hair_curl) query += ` AND hair_curl = ${conn.escape(hair_curl)}`;

  // If latitude, longitude, and distance are provided, filter users by distance
  if (latitude && longitude && distance) {
    query += `
      AND (
        6371 * acos(
          cos(radians(${conn.escape(latitude)})) * cos(radians(user_latitude)) *
          cos(radians(user_longitude) - radians(${conn.escape(longitude)})) +
          sin(radians(${conn.escape(latitude)})) * sin(radians(user_latitude))
        )
      ) <= ${conn.escape(distance)}
    `;
  }

  console.log("Executing query:", query);

  // Execute the query
  conn.query(query, (err, results) => {
    if (err) {
      return res.status(500).send({
        msg: "Database error while filtering users",
        error: err,
      });
    }
    return res.status(200).send({
      status: "success",
      users: results,
    });
  });
};

