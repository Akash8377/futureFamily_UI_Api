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
// Add these endpoints to your auth.js file
exports.saveHlaData = (req, res) => {
  const userId = req.userId;
  const hlaData = req.body;

  if (!userId) {
    return res.status(401).send({ msg: "Unauthorized" });
  }

  try {
    const hlaDataJSON = JSON.stringify(hlaData);

    // Check if record exists in hla_data table
    const checkQuery = `SELECT id FROM hla_data WHERE user_id = ?`;
    
    conn.query(checkQuery, [userId], (checkErr, checkResult) => {
      if (checkErr) {
        console.error("Error checking HLA data:", checkErr);
        return res.status(500).send({ 
          msg: "Database error",
          error: checkErr 
        });
      }

      if (checkResult.length > 0) {
        // Update existing record
        const updateQuery = `UPDATE hla_data SET hla_alleles = ?, updated_at = NOW() WHERE user_id = ?`;
        conn.query(updateQuery, [hlaDataJSON, userId], (updateErr, updateResult) => {
          if (updateErr) {
            console.error("Error updating HLA data:", updateErr);
            return res.status(500).send({ 
              msg: "Failed to update HLA data",
              error: updateErr 
            });
          }
          res.status(200).send({
            status: "success",
            msg: "HLA data updated successfully"
          });
        });
      } else {
        // Insert new record
        const insertQuery = `INSERT INTO hla_data (user_id, hla_alleles, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`;
        conn.query(insertQuery, [userId, hlaDataJSON], (insertErr, insertResult) => {
          if (insertErr) {
            console.error("Error inserting HLA data:", insertErr);
            return res.status(500).send({ 
              msg: "Failed to save HLA data",
              error: insertErr 
            });
          }
          res.status(200).send({
            status: "success",
            msg: "HLA data saved successfully"
          });
        });
      }
    });

  } catch (error) {
    console.error("Error in saveHlaData:", error);
    return res.status(500).send({ 
      msg: "Failed to save HLA data",
      error: error 
    });
  }
};

exports.getHlaData = (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).send({ msg: "Unauthorized" });
  }

  const query = `SELECT hla_alleles FROM hla_data WHERE user_id = ?`;
  
  conn.query(query, [userId], (err, result) => {
    if (err) {
      console.error("Error fetching HLA data:", err);
      return res.status(500).send({ 
        msg: "Failed to fetch HLA data",
        error: err 
      });
    }

    let hlaData = {};
    try {
      // Parse the JSON data if it exists
      if (result.length > 0 && result[0].hla_alleles) {
        hlaData = JSON.parse(result[0].hla_alleles);
      }
    } catch (parseError) {
      console.error("Error parsing HLA data:", parseError);
      // Return empty object if parsing fails
      hlaData = {};
    }

    res.status(200).send({
      status: "success",
      hla_data: hlaData
    });
  });
};
// Get genetic markers for current user (grouped)
exports.getGeneticMarkers = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(400).json({ msg: "User ID is required." });
    }

    const query = `
      SELECT gm.gene_name, gm.response, gm.created_at, gm.updated_at, 
             u.first_name, u.last_name
      FROM genetic_markers gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.user_id = ?
    `;

    const [results] = await pool.query(query, [user_id]);

    if (!results || results.length === 0) {
      return res.status(404).json({ msg: "No genetic markers found for this user." });
    }

    const { first_name, last_name } = results[0];

    const markers = {};
    results.forEach((row) => {
      markers[row.gene_name] = row.response;
    });

    const groupedMarkers = groupMarkers(markers);

    return res.status(200).json({ 
      user_id, 
      first_name, 
      last_name, 
      grouped_genetic_markers: groupedMarkers 
    });
  } catch (error) {
    console.error("Error fetching genetic markers:", error);
    return res.status(500).json({ msg: "Internal server error", error: error.message });
  }
};

const calculateHLAScore = (userHLA, partnerHLA) => {
  if (!userHLA || !partnerHLA) return 0;
  
  let score = 0;
  
  // Define all HLA gene pairs with their scoring rules
  const genePairs = [
    // Class I Genes (4 points for exact match, 2 points for same family)
    {key: 'HLA-A1', family: 'HLA-A', pointsExact: 4, pointsFamily: 2},
    {key: 'HLA-A2', family: 'HLA-A', pointsExact: 4, pointsFamily: 2},
    {key: 'HLA-B1', family: 'HLA-B', pointsExact: 4, pointsFamily: 2},
    {key: 'HLA-B2', family: 'HLA-B', pointsExact: 4, pointsFamily: 2},
    {key: 'HLA-C1', family: 'HLA-C', pointsExact: 4, pointsFamily: 2},
    {key: 'HLA-C2', family: 'HLA-C', pointsExact: 4, pointsFamily: 2},
    
    // Class II Genes - DP, DQ (4 points only for exact match, no family points)
    {key: 'HLA-DPA11', family: null, pointsExact: 4, pointsFamily: 0},
    {key: 'HLA-DPA12', family: null, pointsExact: 4, pointsFamily: 0},
    {key: 'HLA-DPB11', family: null, pointsExact: 4, pointsFamily: 0},
    {key: 'HLA-DPB12', family: null, pointsExact: 4, pointsFamily: 0},
    {key: 'HLA-DQA11', family: null, pointsExact: 4, pointsFamily: 0},
    {key: 'HLA-DQA12', family: null, pointsExact: 4, pointsFamily: 0},
    {key: 'HLA-DQB11', family: null, pointsExact: 4, pointsFamily: 0},
    {key: 'HLA-DQB12', family: null, pointsExact: 4, pointsFamily: 0},
    
    // Class II Genes - DR (4 points for exact match, 2 points for same family)
    {key: 'HLA-DRB11', family: 'HLA-DRB1', pointsExact: 4, pointsFamily: 2},
    {key: 'HLA-DRB12', family: 'HLA-DRB1', pointsExact: 4, pointsFamily: 2},
    
    // Optional DRB genes (4 points only for exact match)
    {key: 'HLA-DRB3', family: null, pointsExact: 4, pointsFamily: 0},
    {key: 'HLA-DRB4', family: null, pointsExact: 4, pointsFamily: 0},
    {key: 'HLA-DRB5', family: null, pointsExact: 4, pointsFamily: 0}
  ];
  
  // Calculate score
  genePairs.forEach(({key, family, pointsExact, pointsFamily}) => {
    let userAllele = userHLA[key];
    let partnerAllele = partnerHLA[key];
    
    if (!userAllele || !partnerAllele) return;
    
    // Handle "Other" selections with custom values
    if (userAllele === "Other" && userHLA[`${key}_other`]) {
      userAllele = userHLA[`${key}_other`];
    }
    
    if (partnerAllele === "Other" && partnerHLA[`${key}_other`]) {
      partnerAllele = partnerHLA[`${key}_other`];
    }
    
    // Skip if either value is still "Other" without valid custom value
    if (userAllele === "Other" || partnerAllele === "Other") {
      return;
    }
    
    // Clean and normalize allele values
    const cleanUserAllele = userAllele.replace('HLA-', '').trim();
    const cleanPartnerAllele = partnerAllele.replace('HLA-', '').trim();
    
    // Exact match
    if (cleanUserAllele === cleanPartnerAllele) {
      score += pointsExact;
      return;
    }
    
    // Same family match (only for genes that support it)
    if (family && pointsFamily > 0) {
      const userFamily = cleanUserAllele.split('*')[0];
      const partnerFamily = cleanPartnerAllele.split('*')[0];
      
      if (userFamily === partnerFamily) {
        score += pointsFamily;
        return;
      }
    }
    
    // No match = 0 points
  });
  
  return score;
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
