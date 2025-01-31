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
    user_id,
    min_age,
    max_age,
    min_height,
    max_height,
    min_weight,
    max_weight,
    children_count,
    children_wanted,
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
    distance,
  } = req.query;

  // First, get the logged-in user's latitude & longitude
  const userQuery = `SELECT latitude, longitude FROM users WHERE id = ?`;

  conn.query(userQuery, [user_id], (err, userResult) => {
    if (err || userResult.length === 0) {
      return res
        .status(500)
        .send({ msg: "Error fetching user location", error: err });
    }

    const { latitude, longitude } = userResult[0]; // Logged-in user's location

    // Start SQL query
    let query = `
            SELECT user_profiles.*, users.dob, users.latitude AS user_lat, users.longitude AS user_long,
            TIMESTAMPDIFF(YEAR, users.dob, CURDATE()) AS age,
            (6371 * ACOS(
                COS(RADIANS(?)) * COS(RADIANS(users.latitude)) *
                COS(RADIANS(users.longitude) - RADIANS(?)) +
                SIN(RADIANS(?)) * SIN(RADIANS(users.latitude))
            )) AS distance
            FROM user_profiles
            JOIN users ON user_profiles.user_id = users.id
            WHERE users.id != ?
        `;

    let queryParams = [latitude, longitude, latitude, user_id];

    // Apply filters
    if (min_age && max_age) {
      query += ` AND TIMESTAMPDIFF(YEAR, users.dob, CURDATE()) BETWEEN ? AND ?`;
      queryParams.push(min_age, max_age);
    }
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
            
    if (children_count !== undefined) {
        query += ` AND children_count = ?`;
        queryParams.push(children_count);
    }

    
    if (children_wanted !== undefined) {
        query += ` AND children_wanted = ?`;
        queryParams.push(children_wanted);
    }
    if (education_level) {
      query += ` AND education_level = ?`;
      queryParams.push(education_level);
    }
    if (languages) {
      query += ` AND languages LIKE ?`;
      queryParams.push(`%${languages}%`);
    }
    if (religion) {
      query += ` AND religion = ?`;
      queryParams.push(religion);
    }
    if (employment_status) {
      query += ` AND employment_status = ?`;
      queryParams.push(employment_status);
    }
    if (occupation) {
      query += ` AND occupation LIKE ?`;
      queryParams.push(`%${occupation}%`);
    }
    if (income) {
      query += ` AND income = ?`;
      queryParams.push(income);
    }
    if (relationship_type) {
      query += ` AND relationship_type = ?`;
      queryParams.push(relationship_type);
    }
    if (alcohol_usage) {
      query += ` AND alcohol_usage = ?`;
      queryParams.push(alcohol_usage);
    }
    if (smoking_tobacco) {
      query += ` AND smoking_tobacco = ?`;
      queryParams.push(smoking_tobacco);
    }
    if (smoking_weed) {
      query += ` AND smoking_weed = ?`;
      queryParams.push(smoking_weed);
    }
    if (personal_interests) {
      query += ` AND personal_interests LIKE ?`;
      queryParams.push(`%${personal_interests}%`);
    }
    if (kinks) {
      query += ` AND kinks LIKE ?`;
      queryParams.push(`%${kinks}%`);
    }
    if (western_zodiac) {
      query += ` AND western_zodiac = ?`;
      queryParams.push(western_zodiac);
    }
    if (eastern_zodiac) {
      query += ` AND eastern_zodiac = ?`;
      queryParams.push(eastern_zodiac);
    }
    if (movie_preferences) {
      query += ` AND movie_preferences LIKE ?`;
      queryParams.push(`%${movie_preferences}%`);
    }
    if (music_preferences) {
      query += ` AND music_preferences LIKE ?`;
      queryParams.push(`%${music_preferences}%`);
    }
    if (pets) {
      query += ` AND pets LIKE ?`;
      queryParams.push(`%${pets}%`);
    }
    if (allergies) {
      query += ` AND allergies LIKE ?`;
      queryParams.push(`%${allergies}%`);
    }
    if (disabilities) {
      query += ` AND disabilities LIKE ?`;
      queryParams.push(`%${disabilities}%`);
    }
    if (vaccinated) {
      query += ` AND vaccinated = ?`;
      queryParams.push(vaccinated);
    }
    if (blood_type) {
      query += ` AND blood_type = ?`;
      queryParams.push(blood_type);
    }
    if (eye_color) {
      query += ` AND eye_color = ?`;
      queryParams.push(eye_color);
    }
    if (hair_color) {
      query += ` AND hair_color = ?`;
      queryParams.push(hair_color);
    }
    if (hair_curl) {
      query += ` AND hair_curl = ?`;
      queryParams.push(hair_curl);
    }

    // Apply distance filter
    if (distance) {
      query += ` HAVING distance <= ? ORDER BY distance ASC`;
      queryParams.push(distance);
    } else {
      query += ` ORDER BY distance ASC`; // Sort by closest users
    }

    // Execute the query
    console.log("Executing query:", query);
    conn.query(query, queryParams, (err, results) => {
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
  });
};



exports.get_matching_percentage = (req, res) => {
    // Validate input parameters
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ errors: errors.array() });
    }
  
    const { user_id } = req.query;
  
    // First, get the logged-in user's profile
    const userQuery = `SELECT * FROM users WHERE id = ?`;
  
    conn.query(userQuery, [user_id], (err, userResult) => {
      if (err || userResult.length === 0) {
        return res
          .status(500)
          .send({ msg: "Error fetching user profile", error: err });
      }
  
      const loggedInUser = userResult[0];
      console.log("Logged-in User:", loggedInUser); // Debugging: Log the logged-in user profile
  
      // SQL query to get all users' profiles
      let query = `
        SELECT user_profiles.*, users.dob, users.latitude AS user_lat, users.longitude AS user_long
        FROM user_profiles
        JOIN users ON user_profiles.user_id = users.id
        WHERE users.id != ?
      `;
  
      let queryParams = [user_id];
  
      // Execute the query to fetch users
      conn.query(query, queryParams, (err, results) => {
        if (err) {
          return res.status(500).send({
            msg: "Database error while fetching user profiles",
            error: err,
          });
        }
  
        if (!results || results.length === 0) {
          return res.status(200).send({
            status: "success",
            message: "No other users found",
          });
        }
  
        console.log("Fetched Users:", results); // Debugging: Log the fetched users
  
        // Function to calculate matching percentage
        function calculateMatchingPercentage(user) {
          let matchScore = 0;
          let totalCriteria = 0;
  
          // List of fields to compare between logged-in user and current user
          const compareFields = [
            { field: 'dob', maxValue: 10, compare: (u1, u2) => {
              // Calculate age for both users
              const age1 = new Date().getFullYear() - new Date(u1).getFullYear();
              const age2 = new Date().getFullYear() - new Date(u2).getFullYear();
              return age1 === age2;
            }},
            { field: 'height', maxValue: 10, compare: (u1, u2) => u1 === u2 },
            { field: 'weight', maxValue: 10, compare: (u1, u2) => u1 === u2 },
            { field: 'children_count', maxValue: 10, compare: (u1, u2) => u1 === u2 },
            { field: 'children_wanted', maxValue: 10, compare: (u1, u2) => u1 === u2 },
            { field: 'education_level', maxValue: 5, compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase() },
            { field: 'languages', maxValue: 5, compare: (u1, u2) => u1.toLowerCase().split(',').sort().join(',') === u2.toLowerCase().split(',').sort().join(',') },
            { field: 'religion', maxValue: 5, compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase() },
            { field: 'employment_status', maxValue: 5, compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase() },
            { field: 'occupation', maxValue: 5, compare: (u1, u2) => u1.toLowerCase().includes(u2.toLowerCase()) || u2.toLowerCase().includes(u1.toLowerCase()) },
            { field: 'income', maxValue: 5, compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase() },
            { field: 'relationship_type', maxValue: 5, compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase() },
            { field: 'alcohol_usage', maxValue: 5, compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase() },
            { field: 'smoking_tobacco', maxValue: 5, compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase() },
            { field: 'smoking_weed', maxValue: 5, compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase() },
            { field: 'personal_interests', maxValue: 5, compare: (u1, u2) => u1.toLowerCase().includes(u2.toLowerCase()) || u2.toLowerCase().includes(u1.toLowerCase()) },
            { field: 'kinks', maxValue: 5, compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase() },
            { field: 'western_zodiac', maxValue: 5, compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase() },
            { field: 'eastern_zodiac', maxValue: 5, compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase() },
            { field: 'movie_preferences', maxValue: 5, compare: (u1, u2) => u1.toLowerCase().includes(u2.toLowerCase()) || u2.toLowerCase().includes(u1.toLowerCase()) },
            { field: 'music_preferences', maxValue: 5, compare: (u1, u2) => u1.toLowerCase().includes(u2.toLowerCase()) || u2.toLowerCase().includes(u1.toLowerCase()) },
            { field: 'pets', maxValue: 5, compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase() },
            { field: 'allergies', maxValue: 5, compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase() },
            { field: 'disabilities', maxValue: 5, compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase() },
            { field: 'vaccinated', maxValue: 5, compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase() },
            { field: 'blood_type', maxValue: 5, compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase() },
            { field: 'eye_color', maxValue: 5, compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase() },
            { field: 'hair_color', maxValue: 5, compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase() },
            { field: 'hair_curl', maxValue: 5, compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase() },
          ];
  
          // Loop through fields and calculate matching score
          compareFields.forEach(({ field, maxValue, compare }) => {
            if (compare(loggedInUser[field], user[field])) {
              matchScore += maxValue;
            }
            if (loggedInUser[field]) {
              totalCriteria += maxValue;
            }
          });
  
          // If no criteria match, return 0%
          if (totalCriteria === 0) return 0;
  
          // Return the percentage
          return (matchScore / totalCriteria) * 100;
        }
  
        // Calculate matching percentages for all users
        const usersWithMatches = results.map((user) => {
          const matchPercentage = calculateMatchingPercentage(user);
          return { ...user, matchPercentage };
        });
  
        console.log("Users with Match Percentages:", usersWithMatches); // Debugging: Log final results
  
        return res.status(200).send({
          status: "success",
          users: usersWithMatches,
        });
      });
    });
  };
  

  