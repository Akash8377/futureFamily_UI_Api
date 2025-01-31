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

  // Get user ID from JWT (set in authentication middleware)
  const user_id = req.userId;
  if (!user_id) {
    return res
      .status(401)
      .json({ msg: "Unauthorized: User ID missing from token" });
  }

  // Start SQL query
  let query = `
          SELECT profile_data.*, users.dob, 
          TIMESTAMPDIFF(YEAR, users.dob, CURDATE()) AS age
          FROM profile_data
          JOIN users ON profile_data.user_id = users.id
          WHERE users.id != ?
      `;

  let queryParams = [user_id];

  // Extract filter parameters
  const {
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
  } = req.query;

  // Apply dynamic filters
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
    query += ` AND body_type = ?`;
    queryParams.push(body_type);
  }
  if (ethnicity) {
    query += ` AND ethnicity = ?`;
    queryParams.push(ethnicity);
  }
  if (eye_color) {
    query += ` AND eye_color = ?`;
    queryParams.push(eye_color);
  }
  if (hair_color) {
    query += ` AND hair_color = ?`;
    queryParams.push(hair_color);
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
    query += ` AND preferred_environment = ?`;
    queryParams.push(preferred_environment);
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
  if (cultural_or_religious_beliefs) {
    query += ` AND cultural_or_religious_beliefs = ?`;
    queryParams.push(cultural_or_religious_beliefs);
  }
  if (family_dynamics) {
    query += ` AND family_dynamics = ?`;
    queryParams.push(family_dynamics);
  }
  if (relationship_with_parents) {
    query += ` AND relationship_with_parents = ?`;
    queryParams.push(relationship_with_parents);
  }
  if (importance_of_family) {
    query += ` AND importance_of_family = ?`;
    queryParams.push(importance_of_family);
  }

  // Execute the query
  //console.log("Executing query:", query);
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
          {
            field: "dob",
            maxValue: 10,
            compare: (u1, u2) => {
              // Calculate age for both users
              const age1 =
                new Date().getFullYear() - new Date(u1).getFullYear();
              const age2 =
                new Date().getFullYear() - new Date(u2).getFullYear();
              return age1 === age2;
            },
          },
          { field: "height", maxValue: 10, compare: (u1, u2) => u1 === u2 },
          { field: "weight", maxValue: 10, compare: (u1, u2) => u1 === u2 },
          {
            field: "children_count",
            maxValue: 10,
            compare: (u1, u2) => u1 === u2,
          },
          {
            field: "children_wanted",
            maxValue: 10,
            compare: (u1, u2) => u1 === u2,
          },
          {
            field: "education_level",
            maxValue: 5,
            compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase(),
          },
          {
            field: "languages",
            maxValue: 5,
            compare: (u1, u2) =>
              u1.toLowerCase().split(",").sort().join(",") ===
              u2.toLowerCase().split(",").sort().join(","),
          },
          {
            field: "religion",
            maxValue: 5,
            compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase(),
          },
          {
            field: "employment_status",
            maxValue: 5,
            compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase(),
          },
          {
            field: "occupation",
            maxValue: 5,
            compare: (u1, u2) =>
              u1.toLowerCase().includes(u2.toLowerCase()) ||
              u2.toLowerCase().includes(u1.toLowerCase()),
          },
          {
            field: "income",
            maxValue: 5,
            compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase(),
          },
          {
            field: "relationship_type",
            maxValue: 5,
            compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase(),
          },
          {
            field: "alcohol_usage",
            maxValue: 5,
            compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase(),
          },
          {
            field: "smoking_tobacco",
            maxValue: 5,
            compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase(),
          },
          {
            field: "smoking_weed",
            maxValue: 5,
            compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase(),
          },
          {
            field: "personal_interests",
            maxValue: 5,
            compare: (u1, u2) =>
              u1.toLowerCase().includes(u2.toLowerCase()) ||
              u2.toLowerCase().includes(u1.toLowerCase()),
          },
          {
            field: "kinks",
            maxValue: 5,
            compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase(),
          },
          {
            field: "western_zodiac",
            maxValue: 5,
            compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase(),
          },
          {
            field: "eastern_zodiac",
            maxValue: 5,
            compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase(),
          },
          {
            field: "movie_preferences",
            maxValue: 5,
            compare: (u1, u2) =>
              u1.toLowerCase().includes(u2.toLowerCase()) ||
              u2.toLowerCase().includes(u1.toLowerCase()),
          },
          {
            field: "music_preferences",
            maxValue: 5,
            compare: (u1, u2) =>
              u1.toLowerCase().includes(u2.toLowerCase()) ||
              u2.toLowerCase().includes(u1.toLowerCase()),
          },
          {
            field: "pets",
            maxValue: 5,
            compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase(),
          },
          {
            field: "allergies",
            maxValue: 5,
            compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase(),
          },
          {
            field: "disabilities",
            maxValue: 5,
            compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase(),
          },
          {
            field: "vaccinated",
            maxValue: 5,
            compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase(),
          },
          {
            field: "blood_type",
            maxValue: 5,
            compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase(),
          },
          {
            field: "eye_color",
            maxValue: 5,
            compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase(),
          },
          {
            field: "hair_color",
            maxValue: 5,
            compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase(),
          },
          {
            field: "hair_curl",
            maxValue: 5,
            compare: (u1, u2) => u1.toLowerCase() === u2.toLowerCase(),
          },
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



// Function to calculate match percentage
const calculateMatchPercentage = (userA, userB) => {
    let matchScore = 0;
    let totalWeight = 0;

    // Personal Information (48%)
    const personalInfoWeights = {
        height: 0.10, weight: 0.10, body_type: 0.20,
        ethnicity: 0.10, eye_color: 0.09, hair_color: 0.09
    };

    if (userA.height === userB.height) matchScore += personalInfoWeights.height * 48;
    if (userA.weight === userB.weight) matchScore += personalInfoWeights.weight * 48;
    if (userA.body_type === userB.body_type) matchScore += personalInfoWeights.body_type * 48;
    if (userA.ethnicity === userB.ethnicity) matchScore += personalInfoWeights.ethnicity * 48;
    if (userA.eye_color === userB.eye_color) matchScore += personalInfoWeights.eye_color * 48;
    if (userA.hair_color === userB.hair_color) matchScore += personalInfoWeights.hair_color * 48;
    totalWeight += 48;

    // Genetic and Health Information (5%)
    const geneticWeights = { blood_type: 0.25, family_history: 0.25, genetic_testing: 0.25, reproductive_health: 0.25 };

    if (userA.blood_type === userB.blood_type) matchScore += geneticWeights.blood_type * 5;
    if (userA.family_history_of_genetic_disorders === userB.family_history_of_genetic_disorders) matchScore += geneticWeights.family_history * 5;
    if (userA.genetic_testing_results === userB.genetic_testing_results) matchScore += geneticWeights.genetic_testing * 5;
    if (userA.reproductive_health === userB.reproductive_health) matchScore += geneticWeights.reproductive_health * 5;
    totalWeight += 5;

    // Biochemical and Physiological Factors (15%)
    const bioWeights = { energy_levels: 0.33, diet: 0.33, exercise_level: 0.34 };

    if (userA.energy_levels === userB.energy_levels) matchScore += bioWeights.energy_levels * 15;
    if (userA.diet === userB.diet) matchScore += bioWeights.diet * 15;
    if (userA.exercise_level === userB.exercise_level) matchScore += bioWeights.exercise_level * 15;
    totalWeight += 15;

    // Psychological Traits (10%)
    const psychologyWeights = { attachment_style: 0.20, conflict_resolution: 0.20, risk_tolerance: 0.20, humor: 0.20, stress_handling: 0.20 };

    if (userA.attachment_style === userB.attachment_style) matchScore += psychologyWeights.attachment_style * 10;
    if (userA.conflict_resolution_style === userB.conflict_resolution_style) matchScore += psychologyWeights.conflict_resolution * 10;
    if (userA.risk_tolerance === userB.risk_tolerance) matchScore += psychologyWeights.risk_tolerance * 10;
    if (userA.sense_of_humor === userB.sense_of_humor) matchScore += psychologyWeights.humor * 10;
    if (userA.stress_handling === userB.stress_handling) matchScore += psychologyWeights.stress_handling * 10;
    totalWeight += 10;

    // Lifestyle (8%)
    const lifestyleWeights = { work_life_balance: 0.25, social_preferences: 0.25, environment: 0.25, travel: 0.25 };

    if (userA.work_life_balance === userB.work_life_balance) matchScore += lifestyleWeights.work_life_balance * 8;
    if (userA.social_preferences === userB.social_preferences) matchScore += lifestyleWeights.social_preferences * 8;
    if (userA.preferred_environment === userB.preferred_environment) matchScore += lifestyleWeights.environment * 8;
    if (userA.importance_of_travel === userB.importance_of_travel) matchScore += lifestyleWeights.travel * 8;
    totalWeight += 8;

    // Values and Long-Term Goals (8%)
    const valuesWeights = { children: 0.25, num_children: 0.25, parenting: 0.25, career_goals: 0.25 };

    if (userA.want_children === userB.want_children) matchScore += valuesWeights.children * 8;
    if (userA.number_of_children === userB.number_of_children) matchScore += valuesWeights.num_children * 8;
    if (userA.parenting_style === userB.parenting_style) matchScore += valuesWeights.parenting * 8;
    if (userA.career_goals === userB.career_goals) matchScore += valuesWeights.career_goals * 8;
    totalWeight += 8;

    // Family and Upbringing (8%)
    const familyWeights = { family_dynamics: 0.33, relationship_parents: 0.33, importance_family: 0.34 };

    if (userA.family_dynamics === userB.family_dynamics) matchScore += familyWeights.family_dynamics * 8;
    if (userA.relationship_with_parents === userB.relationship_with_parents) matchScore += familyWeights.relationship_parents * 8;
    if (userA.importance_of_family === userB.importance_of_family) matchScore += familyWeights.importance_family * 8;
    totalWeight += 8;

    // Calculate final match percentage
    const matchPercentage = (matchScore / totalWeight) * 100;
    return matchPercentage.toFixed(2);
};

// Fetch and compare users
exports.findMatches = (req, res) => {
    const user_id = req.userId; // Get logged-in user ID from JWT

    if (!user_id) {
        return res.status(400).json({ msg: "User ID missing in JWT" });
    }

    // Get logged-in user data
    conn.query(`SELECT * FROM profile_data WHERE user_id = ?`, [user_id], (err, userA) => {
        if (err || userA.length === 0) {
            return res.status(500).json({ msg: "Error fetching user profile" });
        }

        const loggedInUser = userA[0];

        // Get all other users
        conn.query(`SELECT * FROM profile_data WHERE user_id != ?`, [user_id], (err, otherUsers) => {
            if (err) {
                return res.status(500).json({ msg: "Error fetching users" });
            }

            // Calculate match percentage for each user
            const matchedUsers = otherUsers.map(userB => ({
                user_id: userB.user_id,
                match_percentage: calculateMatchPercentage(loggedInUser, userB)
            }));

            // Sort by highest match percentage
            matchedUsers.sort((a, b) => b.match_percentage - a.match_percentage);

            return res.status(200).json({
                status: "success",
                users: matchedUsers
            });
        });
    });
};
