const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const token_key = process.env.TOKEN_KEY;

// Onboarding Function
exports.onboarding = (req, res) => {
  // Validate user input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ errors: errors.array() });
  }

  // const { email, profile_pic, dna, screen_name, city, latitude, longitude, dob, personality_type } = req.body;
  const {
    email,
    profile_pic,
    dna,
    screen_name,
    region,
    latitude,
    longitude,
    dob,
    personality_type,
  } = req.body;

  // Check if the user already exists
  conn.query(
    `SELECT * FROM users WHERE email = ${conn.escape(email)}`,
    (err, result) => {
      if (err) {
        return res.status(500).send({
          msg: "Database error",
          error: err,
        });
      }

      if (result.length) {
        // If user exists, update their data
        conn.query(
          `UPDATE users 
             SET screen_name = ${conn.escape(screen_name)}, 
            profile_pic = ${conn.escape(profile_pic)}, 
            dna = ${conn.escape(dna)}, 
             profile_pic = ${conn.escape(profile_pic)},
                 dob = ${conn.escape(dob)}, 
                 region_of_residence = ${conn.escape(region)},
                 latitude = ${conn.escape(latitude)},  
                 longitude = ${conn.escape(longitude)}, 
                 personality_type = ${conn.escape(personality_type)} 
             WHERE email = ${conn.escape(email)}`,
          // `UPDATE users
          //  SET screen_name = ${conn.escape(screen_name)},
          // profile_pic = ${conn.escape(profile_pic)},
          // dna = ${conn.escape(dna)},
          //  profile_pic = ${conn.escape(profile_pic)},
          //      dob = ${conn.escape(dob)},
          //      city_of_residence = ${conn.escape(city)},
          //      latitude = ${conn.escape(latitude)},
          //      longitude = ${conn.escape(longitude)},
          //      personality_type = ${conn.escape(personality_type)}
          //  WHERE email = ${conn.escape(email)}`,
          (updateErr) => {
            if (updateErr) {
              return res.status(500).send({
                msg: "Database error while updating user",
                error: updateErr,
              });
            }
            return res.status(200).send({
              status: "success",
              msg: "User data updated successfully!",
            });
          }
        );
      }
    }
  );
};
