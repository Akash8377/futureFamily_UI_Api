const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const token_key = process.env.TOKEN_KEY;



exports.saveGeneticMarkers = (req, res) => {
  const user_id = req.userId; // Assume this comes from authentication middleware
  const markers = req.body; // Object containing multiple key-value pairs
  const values = [];

  if (!user_id) {
    return res.status(400).json({ msg: "User ID is required." });
  }

  // Loop through markers and format them for bulk insert
  for (const [gene_name, response] of Object.entries(markers)) {
    const response_value = parseInt(response, 10);
    if (isNaN(response_value) || (response_value !== 0 && response_value !== 1)) {
      return res.status(400).json({ msg: `Invalid response value for ${gene_name}. Must be 0 or 1.` });
    }
    values.push([user_id, gene_name, response_value]);
  }

  if (values.length === 0) {
    return res.status(400).json({ msg: "No valid genetic markers provided." });
  }

  // Debug: Log values before executing query
  console.log("Inserting Values:", values);

  const query = `
    INSERT INTO genetic_markers (user_id, gene_name, response) 
    VALUES ${values.map(() => "(?, ?, ?)").join(", ")}
    ON DUPLICATE KEY UPDATE response = VALUES(response), updated_at = NOW();
  `;

  // Flatten values array for MySQL
  const flattenedValues = values.flat();

  conn.query(query, flattenedValues, (err) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ msg: "Database error", error: err });
    }
    res.status(200).json({ msg: "Genetic markers response saved successfully" });
  });
};



// Get genetic markers for a specific user
exports.getGeneticMarkers = (req, res) => {
  const user_id = req.userId; // Assume this comes from authentication middleware

  if (!user_id) {
    return res.status(400).json({ msg: "User ID is required." });
  }

  const query = `
    SELECT gene_name, response, created_at, updated_at 
    FROM genetic_markers 
    WHERE user_id = ?
  `;

  conn.query(query, [user_id], (err, results) => {
    if (err) {
      return res.status(500).json({ msg: "Database error", error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ msg: "No genetic markers found for this user." });
    }

    // Convert results into key-value format
    const markers = {};
    results.forEach((row) => {
      markers[row.gene_name] = row.response;
    });

    res.status(200).json({ user_id, genetic_markers: markers });
  });
};

exports.getGeneticMarkersByUserId = (req, res) => {
  const { user_id } = req.params; // Get user_id from URL parameters

  if (!user_id) {
    return res.status(400).json({ msg: "User ID is required." });
  }

  const query = `
    SELECT gm.gene_name, gm.response, gm.created_at, gm.updated_at, u.first_name, u.last_name 
    FROM genetic_markers gm 
    JOIN users u ON gm.user_id = u.id 
    WHERE gm.user_id = ?
  `;

  conn.query(query, [user_id], (err, results) => {
    if (err) {
      return res.status(500).json({ msg: "Database error", error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ msg: "No genetic markers found for this user." });
    }

    // Extract user info and markers
    const { first_name, last_name } = results[0];
    const markers = {};
    results.forEach((row) => {
      markers[row.gene_name] = row.response;
    });

    res.status(200).json({ user_id, first_name, last_name, genetic_markers: markers });
  });
};
