const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const token_key = process.env.TOKEN_KEY;

exports.savePersonalityResponses = (req, res) => {
  const user_id = req.userId; // Get user ID from authentication middleware
  const { question_ids, responses } = req.body; // Expecting comma-separated strings

  if (!user_id || !question_ids || !responses) {
    return res.status(400).json({ msg: "Invalid request data" });
  }

  // Convert comma-separated strings into arrays of numbers
  const questionIdArray = question_ids.split(",").map(Number);
  const responseArray = responses.split(",").map(Number);

  if (questionIdArray.length !== responseArray.length) {
    return res
      .status(400)
      .json({ msg: "Mismatched question and response count" });
  }

  // Create an array of objects [{ question_id, response }]
  const formattedResponses = questionIdArray.map((id, index) => ({
    question_id: id,
    response: responseArray[index],
  }));

  // Validate each response
  for (let response of formattedResponses) {
    if (
      isNaN(response.question_id) ||
      isNaN(response.response) ||
      response.response < 1 ||
      response.response > 5
    ) {
      return res.status(400).json({ msg: "Invalid response format" });
    }
  }

  // Insert or update responses
  const insertQuery = `
    INSERT INTO user_personality_responses (user_id, question_id, response)
    VALUES ? 
    ON DUPLICATE KEY UPDATE response = VALUES(response)`;

  const values = formattedResponses.map(({ question_id, response }) => [
    user_id,
    question_id,
    response,
  ]);

  conn.query(insertQuery, [values], (err) => {
    if (err) {
      return res.status(500).json({ msg: "Database error", error: err });
    }

    // Query to get the highest trait score
    const traitScoreQuery = `
      SELECT pq.trait, 
       ROUND(AVG(upr.response) * (100/5), 2) AS score 
FROM user_personality_responses upr
JOIN personality_questions pq ON upr.question_id = pq.id
WHERE upr.user_id = ?
GROUP BY pq.trait;
    `;

    conn.query(traitScoreQuery, [user_id], (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ msg: "Error fetching trait scores", error: err });
      }
      res
        .status(200)
        .json({ msg: "Responses updated successfully", top_trait: result });
    });
  });
};

exports.getPersonalityReport = (req, res) => {
  const user_id = req.userId;

  if (!user_id) {
    return res.status(400).json({ msg: "User ID is required" });
  }

  // Fetch personality trait scores
  const traitScoreQuery = `
    WITH trait_scores AS (
      SELECT pq.trait, 
             ROUND(AVG(upr.response) * (100/5), 2) AS score 
      FROM user_personality_responses upr
      JOIN personality_questions pq ON upr.question_id = pq.id
      WHERE upr.user_id = ?
      GROUP BY pq.trait
    )
    SELECT trait, score FROM trait_scores;
  `;

  conn.query(traitScoreQuery, [user_id], (err, traits) => {
    if (err) {
      return res.status(500).json({ msg: "Database error", error: err });
    }

    // Sort traits in descending order by score
    traits.sort((a, b) => b.score - a.score);

    // Select the top 2-3 traits
    const topTraits = traits.slice(0, 3);

    // Generate dynamic personality patterns based on top traits
    const personalityPatterns = generatePersonalityPatterns(topTraits);

    res.status(200).json({
      msg: "Personality report generated",
      traits,
      personalityPatterns,
      summary: generatePersonalitySummary(topTraits),
    });
  });
};

const generatePersonalityPatterns = (topTraits) => {
  const patterns = [];

  topTraits.forEach((trait) => {
    switch (trait.trait) {
      case "Openness":
        patterns.push({
          name: "Creative Explorer",
          description: "You are highly imaginative and open to new ideas.",
          score: trait.score,
        });
        break;

      case "Conscientiousness":
        patterns.push({
          name: "Organized Achiever",
          description: "You are disciplined and work efficiently toward goals.",
          score: trait.score,
        });
        break;

      case "Extraversion":
        patterns.push({
          name: "Social Enthusiast",
          description:
            "You enjoy social interactions and engaging with people.",
          score: trait.score,
        });
        break;

      case "Agreeableness":
        patterns.push({
          name: "Compassionate Helper",
          description:
            "You are kind, cooperative, and empathetic towards others.",
          score: trait.score,
        });
        break;

      case "Neuroticism":
        patterns.push({
          name: "Sensitive Thinker",
          description:
            "You experience emotions deeply and are highly self-aware.",
          score: trait.score,
        });
        break;
    }
  });

  return patterns;
};
const generatePersonalitySummary = (topTraits) => {
  // Trait descriptions for better storytelling
  const traitDescriptions = {
    Openness: "a naturally curious and imaginative thinker, drawn to new ideas and creative solutions",
    Conscientiousness: "a highly disciplined and detail-oriented individual who values structure and reliability",
    Extraversion: "a socially confident and energetic person who thrives in dynamic environments",
    Agreeableness: "a compassionate and empathetic soul, always considering the well-being of others",
    Neuroticism: "a deeply introspective individual who experiences emotions with great intensity and depth",
  };

  // Strengths associated with each trait
  const traitStrengths = {
    Openness: "Your ability to embrace new ideas makes you an innovative problem solver, always seeking creative solutions.",
    Conscientiousness: "Your structured approach to life helps you achieve ambitious goals with persistence and precision.",
    Extraversion: "Your enthusiasm and charisma make you a natural leader, effortlessly connecting with people and inspiring them.",
    Agreeableness: "Your kindness and emotional intelligence make you a trusted friend and a strong team player.",
    Neuroticism: "Your emotional depth grants you strong self-awareness, allowing you to navigate complex feelings with insight.",
  };

  // Extract the top trait descriptions and strengths
  const descriptions = topTraits.map((trait) => traitDescriptions[trait.trait]).join(", ");
  const strengths = topTraits.map((trait) => traitStrengths[trait.trait]).join(" ");

  // Generate a more personalized, natural-flowing summary
  return `
    You are ${descriptions}. ${strengths}
    Your strengths lie in your ability to ${topTraits.map((trait) => traitStrengths[trait.trait].split(".")[0]).join(", and ")}.
    Whether you're problem-solving, building relationships, or striving towards your goals.
  `;
};

