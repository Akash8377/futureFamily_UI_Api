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
        user_id, // Logged-in user ID (to exclude)
        min_age,
        max_age,
        min_height,
        max_height,
        min_weight,
        max_weight,
        distance, // Max distance in km
    } = req.query;

    // First, fetch the logged-in user's latitude and longitude
    const getUserLocationQuery = `SELECT latitude, longitude FROM users WHERE id = ?`;

    conn.query(getUserLocationQuery, [user_id], (err, userResult) => {
        if (err || userResult.length === 0) {
            return res.status(500).send({ msg: "Error fetching user location", error: err });
        }

        const { latitude, longitude } = userResult[0];

        if (!latitude || !longitude) {
            return res.status(400).send({ msg: "User location not available" });
        }

        // Start building the main query
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

        const queryParams = [latitude, longitude, latitude, user_id];

        // Apply age filter
        if (min_age && max_age) {
            query += ` AND TIMESTAMPDIFF(YEAR, users.dob, CURDATE()) BETWEEN ? AND ?`;
            queryParams.push(min_age, max_age);
        }

        // Apply height and weight filters
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

        // Apply distance filter and sort by distance
        if (distance) {
            query += ` HAVING distance <= ? ORDER BY distance ASC`;
            queryParams.push(distance);
        } else {
            query += ` ORDER BY distance ASC`; // Sort by distance even if no filter
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


