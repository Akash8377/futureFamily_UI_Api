const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const token_key = process.env.TOKEN_KEY;

exports.savePersonalityResponses = (req, res) => {
  const user_id = req.params.userId;
  const { question_ids, responses } = req.body;

  if (!user_id || !question_ids || !responses) {
    return res.status(400).json({ msg: "Invalid request data" });
  }

  // Convert comma-separated strings into arrays of numbers
  const questionIdArray = question_ids.split(",").map(Number);
  const responseArray = responses.split(",").map(Number);

  if (questionIdArray.length !== responseArray.length) {
    return res.status(400).json({ msg: "Mismatched question and response count" });
  }

  // Validate responses
  for (let i = 0; i < questionIdArray.length; i++) {
    if (isNaN(questionIdArray[i]) || isNaN(responseArray[i]) || responseArray[i] < 1 || responseArray[i] > 5) {
      return res.status(400).json({ msg: "Invalid response format" });
    }
  }

  // Insert or update responses
  const insertQuery = `
    INSERT INTO user_personality_responses (user_id, question_id, response)
    VALUES ? 
    ON DUPLICATE KEY UPDATE response = VALUES(response)`;

  const values = questionIdArray.map((id, index) => [user_id, id, responseArray[index]]);

  conn.query(insertQuery, [values], (err) => {
    if (err) {
      return res.status(500).json({ msg: "Database error", error: err });
    }

    // Query to get all questions and user's saved responses (even if some responses are missing)
    const fullResponseQuery = `
      SELECT pq.id AS question_id, 
             pq.trait, 
             IFNULL(upr.response, '') AS response
      FROM personality_questions pq
      LEFT JOIN user_personality_responses upr 
             ON pq.id = upr.question_id AND upr.user_id = ?
      ORDER BY pq.id;
    `;

    conn.query(fullResponseQuery, [user_id], (err, responseData) => {
      if (err) {
        return res.status(500).json({ msg: "Error fetching responses", error: err });
      }

      // Convert responses into key-value pairs and filter out empty responses
      const savedResponses = responseData.reduce((acc, row) => {
        if (row.response !== "") {
          acc[row.question_id] = String(row.response);
        }
        return acc;
      }, {});

      // Get top trait score
      const traitScoreQuery = `
        SELECT pq.trait, 
               ROUND(AVG(upr.response) * (100/5), 2) AS score 
        FROM user_personality_responses upr
        JOIN personality_questions pq ON upr.question_id = pq.id
        WHERE upr.user_id = ?
        GROUP BY pq.trait;
      `;

      conn.query(traitScoreQuery, [user_id], (err, traitResults) => {
        if (err) {
          return res.status(500).json({ msg: "Error fetching trait scores", error: err });
        }

        // Determine the highest-scoring trait
        let highestTrait = null;
        if (traitResults.length > 0) {
          highestTrait = traitResults.reduce((max, trait) => (trait.score > max.score ? trait : max)).trait;
        }

        // Update personality_type in the users table
        if (highestTrait) {
          const updateUserQuery = `UPDATE users SET personality_type = ? WHERE id = ?`;
          conn.query(updateUserQuery, [highestTrait, user_id], (updateErr) => {
            if (updateErr) {
              console.error("Error updating personality type:", updateErr);
            }
          });
        }

        // Send API response
        res.status(200).json({
          msg: "Responses updated successfully",
          saved_responses: savedResponses, // Only includes non-empty responses
        });
      });
    });
  });
};
exports.getPersonalityResponses = (req, res) => {
  const user_id = req.params.userId;

  if (!user_id) {
    return res.status(400).json({ msg: "Invalid request data" });
  }

  // Query to get all questions and user's saved responses
  const fullResponseQuery = `
    SELECT pq.id AS question_id, 
           pq.trait, 
           IFNULL(upr.response, '') AS response
    FROM personality_questions pq
    LEFT JOIN user_personality_responses upr 
           ON pq.id = upr.question_id AND upr.user_id = ?
    ORDER BY pq.id;
  `;

  conn.query(fullResponseQuery, [user_id], (err, responseData) => {
    if (err) {
      return res.status(500).json({ msg: "Error fetching responses", error: err });
    }

    // Convert responses into key-value pairs and filter out empty responses
    const savedResponses = responseData.reduce((acc, row) => {
      if (row.response !== "") {
        acc[row.question_id] = String(row.response);
      }
      return acc;
    }, {});

    // Send API response
    res.status(200).json({
      msg: "Responses fetched successfully",
      saved_responses: savedResponses, // Only includes non-empty responses
    });
  });
};


exports.getPersonalityReport = (req, res) => {
  const user_id = req.params.userId;

  if (!user_id) {
    return res.status(400).json({ msg: "User ID is required" });
  }

  // Fetch user details along with personality trait scores
  const userQuery = `
    SELECT first_name, last_name FROM users WHERE id = ?;
  `;

  conn.query(userQuery, [user_id], (err, userResult) => {
    if (err) {
      return res.status(500).json({ msg: "Database error", error: err });
    }

    if (userResult.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    const { first_name, last_name } = userResult[0];

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

      // Select the top 4 traits
      const topTraits = traits.slice(0, 5);

      // Generate dynamic personality patterns based on top traits
      const personalityPatterns = generatePersonalityPatterns(topTraits);

      res.status(200).json({
        msg: "Personality report generated",
        user: {
          id: user_id,
          first_name,
          last_name,
        },
        traits,
        personalityPatterns,
        summary: generatePersonalitySummary(topTraits),
      });
    });
  });
};


const generatePersonalityPatterns = (topTraits) => {
  let analyticalThinker = 0;
  let empathicIdealist = 0;
  let logicalMechanic = 0;
  let practicalCaretaker = 0;

  // Assign raw scores
  topTraits.forEach((trait) => {
    switch (trait.trait) {
      case "Openness":
        analyticalThinker = trait.score;
        break;

      case "Agreeableness":
        empathicIdealist = trait.score;
        break;

      case "Neuroticism":
        logicalMechanic = trait.score;
        break;

      case "Extraversion":
        practicalCaretaker = trait.score;
        break;
    }
  });

  // Normalize Group 1 (Analytical Thinker + Empathic Idealist)
  let group1Total = analyticalThinker + empathicIdealist;
  if (group1Total > 0) {
    analyticalThinker = (analyticalThinker / group1Total) * 100;
    empathicIdealist = (empathicIdealist / group1Total) * 100;
  }

  // Normalize Group 2 (Logical Mechanic + Practical Caretaker)
  let group2Total = logicalMechanic + practicalCaretaker;
  if (group2Total > 0) {
    logicalMechanic = (logicalMechanic / group2Total) * 100;
    practicalCaretaker = (practicalCaretaker / group2Total) * 100;
  }

  // Construct the response
  const patterns = [
    {
      name: "Analytical Thinker",
      description: "Solves logical problems with rational, complex analysis.",
      score: parseFloat(analyticalThinker.toFixed(2)),
    },
    {
      name: "Empathic Idealist",
      description: "Uses insight and creativity to help others.",
      score: parseFloat(empathicIdealist.toFixed(2)),
    },
    {
      name: "Logical Mechanic",
      description: "Ensures accuracy and efficiency in logical systems.",
      score: parseFloat(logicalMechanic.toFixed(2)),
    },
    {
      name: "Practical Caretaker",
      description: "Helps other people in practical, everyday ways.",
      score: parseFloat(practicalCaretaker.toFixed(2)),
    },
  ];

  return patterns;
};

const generatePersonalitySummary = (topTraits) => {
  // Trait descriptions for better storytelling
  const traitDescriptions = {
    Openness:
      "a naturally curious and imaginative thinker, drawn to new ideas and creative solutions",
    Conscientiousness:
      "a highly disciplined and detail-oriented individual who values structure and reliability",
    Extraversion:
      "a socially confident and energetic person who thrives in dynamic environments",
    Agreeableness:
      "a compassionate and empathetic soul, always considering the well-being of others",
    Neuroticism:
      "a deeply introspective individual who experiences emotions with great intensity and depth",
  };

  // Strengths associated with each trait
  const traitStrengths = {
    Openness:
      "Your ability to embrace new ideas makes you an innovative problem solver, always seeking creative solutions.",
    Conscientiousness:
      "Your structured approach to life helps you achieve ambitious goals with persistence and precision.",
    Extraversion:
      "Your enthusiasm and charisma make you a natural leader, effortlessly connecting with people and inspiring them.",
    Agreeableness:
      "Your kindness and emotional intelligence make you a trusted friend and a strong team player.",
    Neuroticism:
      "Your emotional depth grants you strong self-awareness, allowing you to navigate complex feelings with insight.",
  };

  // Extract the top trait descriptions and strengths
  const descriptions = topTraits
    .map((trait) => traitDescriptions[trait.trait])
    .join(", ");
  const strengths = topTraits
    .map((trait) => traitStrengths[trait.trait])
    .join(" ");

  // Generate a more personalized, natural-flowing summary
  return `
    You are ${descriptions}. ${strengths}
    Your strengths lie in your ability to ${topTraits
      .map((trait) => traitStrengths[trait.trait].split(".")[0])
      .join(", and ")}.
    Whether you're problem-solving, building relationships, or striving towards your goals.
  `;
};
