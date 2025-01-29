const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const token_key = process.env.TOKEN_KEY;

exports.add_user_profile = (req, res) => {
  // Validate user input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ errors: errors.array() });
  }

  const {
    user_id,
    dna_kit_bar_code,
    bio,
    height,
    weight,
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
    genetic_blood_type,
    genetic_eye_color,
    genetic_hair_color,
    genetic_hair_curl,
    gallery_picture,
    profile_picture,
    dna_file,
  } = req.headers;

  // Check if the user already exists
  conn.query(
    `SELECT * FROM user_profiles WHERE user_id = ${conn.escape(user_id)}`,
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
          `UPDATE user_profiles 
             SET dna_kit_bar_code = ${conn.escape(dna_kit_bar_code)}, 
                 bio = ${conn.escape(bio)}, 
                 height = ${conn.escape(height)}, 
                 weight = ${conn.escape(weight)}, 
                 children_count = ${conn.escape(children_count)}, 
                 children_wanted = ${conn.escape(children_wanted)}, 
                 education_level = ${conn.escape(education_level)}, 
                 languages = ${conn.escape(languages)}, 
                 religion = ${conn.escape(religion)}, 
                 employment_status = ${conn.escape(employment_status)}, 
                 occupation = ${conn.escape(occupation)}, 
                 income = ${conn.escape(income)}, 
                 relationship_type = ${conn.escape(relationship_type)}, 
                 alcohol_usage = ${conn.escape(alcohol_usage)}, 
                 smoking_tobacco = ${conn.escape(smoking_tobacco)}, 
                 smoking_weed = ${conn.escape(smoking_weed)}, 
                 personal_interests = ${conn.escape(personal_interests)}, 
                 kinks = ${conn.escape(kinks)}, 
                 western_zodiac = ${conn.escape(western_zodiac)}, 
                 eastern_zodiac = ${conn.escape(eastern_zodiac)}, 
                 movie_preferences = ${conn.escape(movie_preferences)}, 
                 music_preferences = ${conn.escape(music_preferences)}, 
                 pets = ${conn.escape(pets)}, 
                 allergies = ${conn.escape(allergies)}, 
                 disabilities = ${conn.escape(disabilities)}, 
                 vaccinated = ${conn.escape(vaccinated)}, 
                 blood_type = ${conn.escape(blood_type)}, 
                 eye_color = ${conn.escape(eye_color)}, 
                 hair_color = ${conn.escape(hair_color)}, 
                 hair_curl = ${conn.escape(hair_curl)}, 
                 genetic_blood_type = ${conn.escape(genetic_blood_type)}, 
                 genetic_eye_color = ${conn.escape(genetic_eye_color)}, 
                 genetic_hair_color = ${conn.escape(genetic_hair_color)}, 
                 genetic_hair_curl = ${conn.escape(genetic_hair_curl)}, 
                 gallery_picture = ${conn.escape(gallery_picture)}, 
                 profile_picture = ${conn.escape(profile_picture)}, 
                 dna_file = ${conn.escape(dna_file)} 
             WHERE user_id = ${conn.escape(user_id)}`,
          (updateErr) => {
            if (updateErr) {
              return res.status(500).send({
                msg: "Database error while updating user profile",
                error: updateErr,
              });
            }
            return res.status(200).send({
              status: "success",
              msg: "User profile updated successfully!",
            });
          }
        );
      } else {
        // If the user does not exist, create a new profile
        conn.query(
          `INSERT INTO user_profiles 
             (user_id, dna_kit_bar_code, bio, height, weight, children_count, children_wanted,
              education_level, languages, religion, employment_status, occupation, income,
              relationship_type, alcohol_usage, smoking_tobacco, smoking_weed, personal_interests,
              kinks, western_zodiac, eastern_zodiac, movie_preferences, music_preferences, pets,
              allergies, disabilities, vaccinated, blood_type, eye_color, hair_color, hair_curl,
              genetic_blood_type, genetic_eye_color, genetic_hair_color, genetic_hair_curl, 
              gallery_picture, profile_picture, dna_file)
             VALUES 
             (${conn.escape(user_id)}, ${conn.escape(
            dna_kit_bar_code
          )}, ${conn.escape(bio)}, 
              ${conn.escape(height)}, ${conn.escape(weight)}, ${conn.escape(
            children_count
          )}, 
              ${conn.escape(children_wanted)}, ${conn.escape(
            education_level
          )}, ${conn.escape(languages)}, 
              ${conn.escape(religion)}, ${conn.escape(
            employment_status
          )}, ${conn.escape(occupation)}, 
              ${conn.escape(income)}, ${conn.escape(
            relationship_type
          )}, ${conn.escape(alcohol_usage)}, 
              ${conn.escape(smoking_tobacco)}, ${conn.escape(
            smoking_weed
          )}, ${conn.escape(personal_interests)}, 
              ${conn.escape(kinks)}, ${conn.escape(
            western_zodiac
          )}, ${conn.escape(eastern_zodiac)}, 
              ${conn.escape(movie_preferences)}, ${conn.escape(
            music_preferences
          )}, ${conn.escape(pets)}, 
              ${conn.escape(allergies)}, ${conn.escape(
            disabilities
          )}, ${conn.escape(vaccinated)}, 
              ${conn.escape(blood_type)}, ${conn.escape(
            eye_color
          )}, ${conn.escape(hair_color)}, 
              ${conn.escape(hair_curl)}, ${conn.escape(
            genetic_blood_type
          )}, ${conn.escape(genetic_eye_color)}, 
              ${conn.escape(genetic_hair_color)}, ${conn.escape(
            genetic_hair_curl
          )}, 
              ${conn.escape(gallery_picture)}, ${conn.escape(
            profile_picture
          )}, ${conn.escape(dna_file)})`,
          (insertErr) => {
            if (insertErr) {
              return res.status(500).send({
                msg: "Database error while inserting user profile",
                error: insertErr,
              });
            }
            return res.status(200).send({
              status: "success",
              msg: "User profile created successfully!",
            });
          }
        );
      }
    }
  );
};

exports.edit = (req, res) => {
  const sqlQuery =
    "SELECT * FROM user_profiles WHERE user_id=" +
    conn.escape(req.params.user_id);

  conn.query(sqlQuery, (err, result) => {
    if (err) {
      return res.status(500).send({
        msg: "Database error",
        error: err,
      });
    } else if (result.length === 0) {
      return res.status(404).send({
        msg: "User profile not found",
      });
    } else {
      res.status(200).send({
        status: "success",
        length: result.length,
        data: result,
      });
    }
  });
};

exports.update = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { user_id } = req.params;
  const {
    dna_kit_bar_code,
    bio,
    height,
    weight,
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
    genetic_blood_type,
    genetic_eye_color,
    genetic_hair_color,
    genetic_hair_curl,
    gallery_picture,
    profile_picture,
    dna_file,
  } = req.headers;

  const date_time = new Date();

  const sqlQuery = `UPDATE user_profiles 
                    SET 
                      dna_kit_bar_code = ?, 
                      bio = ?, 
                      height = ?, 
                      weight = ?, 
                      children_count = ?, 
                      children_wanted = ?, 
                      education_level = ?, 
                      languages = ?, 
                      religion = ?, 
                      employment_status = ?, 
                      occupation = ?, 
                      income = ?, 
                      relationship_type = ?, 
                      alcohol_usage = ?, 
                      smoking_tobacco = ?, 
                      smoking_weed = ?, 
                      personal_interests = ?, 
                      kinks = ?, 
                      western_zodiac = ?, 
                      eastern_zodiac = ?, 
                      movie_preferences = ?, 
                      music_preferences = ?, 
                      pets = ?, 
                      allergies = ?, 
                      disabilities = ?, 
                      vaccinated = ?, 
                      blood_type = ?, 
                      eye_color = ?, 
                      hair_color = ?, 
                      hair_curl = ?, 
                      genetic_blood_type = ?, 
                      genetic_eye_color = ?, 
                      genetic_hair_color = ?, 
                      genetic_hair_curl = ?, 
                      gallery_picture = ?, 
                      profile_picture = ?, 
                      dna_file = ?, 
                      updated_at = ? 
                    WHERE user_id = ?`;

  const values = [
    dna_kit_bar_code,
    bio,
    height,
    weight,
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
    genetic_blood_type,
    genetic_eye_color,
    genetic_hair_color,
    genetic_hair_curl,
    gallery_picture,
    profile_picture,
    dna_file,
    date_time,
    user_id,
  ];

  conn.query(sqlQuery, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send({
        msg: "Internal Server Error",
        error: err,
      });
    } else {
      res.status(200).send({
        status: "success",
        msg: "User profile updated successfully!",
      });
    }
  });
};
