const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const token_key = process.env.TOKEN_KEY;

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
  
  exports.getDnaMatch = (req, res) => {
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
          SELECT profile_data.*, users.dob, users.gender, users.looking_for,
          users.first_name, users.last_name, users.profile_pic, users.dna, users.personality_type,
          TIMESTAMPDIFF(YEAR, users.dob, CURDATE()) AS age
          FROM profile_data
          JOIN users ON profile_data.user_id = users.id
          WHERE users.id != ? 
          AND users.gender IN (?)
          AND users.looking_for IN (?)
        `;
  
        let queryParams = [user_id, lookingForArray, [gender]];
  
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