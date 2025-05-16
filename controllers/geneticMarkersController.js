const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const token_key = process.env.TOKEN_KEY;

// Group definitions
const geneticGroups = {
  "Biological Attraction": [
    "ACE", "ACTN3", "ASIP", "AVPR1A", "COMT", "EDAR", "FTO", "HERC2/OCA2",
    "HLA", "LEPR", "MC1R", "PPARG", "SLC24A4", "TAS2R38", "TYR"
  ],
  "Psychological Compatibility": [
    "5-HT2A", "APOE", "ARNTL", "BDNF", "CADM2", "CLOCK", "COMT", "DRD2", "DRD4",
    "FOXP2", "GRIN2B", "KIBRA", "MAOA", "OXTR", "PER1", "PER3", "SLC6A4"
  ],
  "Birth Defect Risk": [
    "APOE", "ATP7A", "CFTR", "COL1A1", "COL1A2", "CYP21A2", "DMD", "FMR1",
    "G6PD", "GJB2", "GLB1", "HBA1", "HBA2", "HBB", "HBB (E variant)", "HEXA",
    "HLA", "MPZ", "MTHFR Variant", "PAH", "SMN1", "TSC1", "TSC2"
  ],
  "Reproductive Health": [
    "BRCA1", "BRCA2", "CFTR", "COMT", "FMR1", "GALT", "HLA", "LEPR",
    "MTHFR", "PHEX"
  ]
};

// Grouping helper
function groupMarkers(markers) {
  const grouped = {
    "Biological Attraction": {},
    "Psychological Compatibility": {},
    "Birth Defect Risk": {},
    "Reproductive Health": {},
    "Other": {}
  };

  for (const [gene, response] of Object.entries(markers)) {
    let matched = false;
    for (const [group, geneList] of Object.entries(geneticGroups)) {
      if (geneList.includes(gene)) {
        grouped[group][gene] = response;
        matched = true;
        break;
      }
    }
    if (!matched) {
      grouped["Other"][gene] = response;
    }
  }

  return grouped;
}

// Save genetic markers
exports.saveGeneticMarkers = (req, res) => {
  const user_id = req.userId;
  const markers = req.body;
  const values = [];

  if (!user_id) {
    return res.status(400).json({ msg: "User ID is required." });
  }

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

  const query = `
    INSERT INTO genetic_markers (user_id, gene_name, response) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE response = VALUES(response), updated_at = NOW();
  `;

  conn.query(query, [values], (err) => {
    if (err) {
      return res.status(500).json({ msg: "Database error", error: err });
    }
    res.status(200).json({ msg: "Genetic markers response saved successfully" });
  });
};

// Get genetic markers for current user (grouped)
exports.getGeneticMarkers = (req, res) => {
  const user_id = req.userId;

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

    const { first_name, last_name } = results[0];
    const markers = {};
    results.forEach((row) => {
      markers[row.gene_name] = row.response;
    });

    const groupedMarkers = groupMarkers(markers);
    res.status(200).json({ 
      user_id, 
      first_name, 
      last_name, 
      grouped_genetic_markers: groupedMarkers 
    });
  });
};

// Get genetic markers by specific user ID (admin view)
exports.getGeneticMarkersByUserId = (req, res) => {
  const { user_id } = req.params;

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

    const { first_name, last_name } = results[0];
    const markers = {};
    results.forEach((row) => {
      markers[row.gene_name] = row.response;
    });

    const groupedMarkers = groupMarkers(markers);
    res.status(200).json({ user_id, first_name, last_name, grouped_genetic_markers: groupedMarkers });
  });
};
