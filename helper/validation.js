const { check } = require("express-validator");

exports.loginUpValidataion = [
  check("email", "Email is required")
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: true }),
  check("password", "Password is required").not().isEmpty(),
];

// Signup Validation
exports.signupValidation = [
  check("first_name", "First Name is required").not().isEmpty(),
  check("last_name", "Last Name is required").not().isEmpty(),
  check("gender", "Gender is required").not().isEmpty(),
  check("looking_for", "Looking For is required").not().isEmpty(),
  check("email", "Email is required")
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: true }),
  check("password", "Password must be at least 6 characters long").isLength({
    min: 6,
  }),
];

// Onboard Validation
exports.onboardValidation = [
  check("email", "email is required").not().isEmpty(),
  check("email", "Email is required")
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: true }),
  check("screen_name", "Screen Name is required").not().isEmpty(),
  check("dob", "DOB is required").not().isEmpty(),
  check("city", "City is required").not().isEmpty(),
  check("personality_type", "Personality Type is required").isEmpty(),
];



exports.userProfileDataValidation = [

  // Height & Weight (must be numeric)
  check("height").optional().isNumeric().withMessage("Height must be a number"),
  check("weight").optional().isNumeric().withMessage("Weight must be a number"),

  // Body Type (must be a string)
  check("body_type").optional().isString().withMessage("Body Type must be a string"),

  // Ethnicity, Eye Color, Hair Color, Blood Type (must be strings)
  check("ethnicity").optional().isString().withMessage("Ethnicity must be a string"),
  check("eye_color").optional().isString().withMessage("Eye Color must be a string"),
  check("hair_color").optional().isString().withMessage("Hair Color must be a string"),
  check("blood_type").optional().isString().withMessage("Blood Type must be a string"),

  // Family History & Genetic Testing (must be Yes/No)
  check("family_history_of_genetic_disorders")
    .optional()
    .isIn(["Yes", "No", null])
    .withMessage("Must be Yes, No, or NULL"),
  check("genetic_testing_results")
    .optional()
    .isIn(["Yes", "No", null])
    .withMessage("Must be Yes, No, or NULL"),

  // Reproductive Health, Genetic Predispositions, Hormonal Profile (must be strings)
  check("reproductive_health").optional().isString().withMessage("Reproductive Health must be a string"),
  check("known_genetic_predispositions").optional().isString().withMessage("Known Genetic Predispositions must be a string"),
  check("hormonal_profile").optional().isString().withMessage("Hormonal Profile must be a string"),

  // Energy Levels, Diet, Exercise Level (must be strings)
  check("energy_levels").optional().isString().withMessage("Energy Levels must be a string"),
  check("diet").optional().isString().withMessage("Diet must be a string"),
  check("exercise_level").optional().isString().withMessage("Exercise Level must be a string"),

  // Fertility History, Attachment Style, Conflict Resolution (must be strings)
  check("fertility_history").optional().isString().withMessage("Fertility History must be a string"),
  check("attachment_style").optional().isString().withMessage("Attachment Style must be a string"),
  check("conflict_resolution_style").optional().isString().withMessage("Conflict Resolution Style must be a string"),

  // Risk Tolerance, Sense of Humor, Stress Handling (must be strings)
  check("risk_tolerance").optional().isString().withMessage("Risk Tolerance must be a string"),
  check("sense_of_humor").optional().isString().withMessage("Sense of Humor must be a string"),
  check("stress_handling").optional().isString().withMessage("Stress Handling must be a string"),

  // Work-Life Balance, Social Preferences, Preferred Environment (must be strings)
  check("work_life_balance").optional().isString().withMessage("Work-Life Balance must be a string"),
  check("social_preferences").optional().isString().withMessage("Social Preferences must be a string"),
  check("preferred_environment").optional().isString().withMessage("Preferred Environment must be a string"),

  // Importance of Travel (must be Yes/No)
  check("importance_of_travel")
    .optional()
    .isIn(["Yes", "No", "Somewhat important"])
    .withMessage("Must be Yes, No, or NULL"),

  // Want Children (must be Yes/No/Maybe or NULL)
  check("want_children")
    .optional()
    .isIn(["Yes", "No", "Maybe", null])
    .withMessage("Must be Yes, No, Maybe, or NULL"),

  // Number of Children (must be a number or NULL)
  check("number_of_children")
    .optional()
    .isString()
    .withMessage("Number of Children must be a number"),

  // Parenting Style, Career Goals, Cultural Beliefs (must be strings)
  check("parenting_style").optional().isString().withMessage("Parenting Style must be a string"),
  check("career_goals").optional().isString().withMessage("Career Goals must be a string"),
  check("cultural_or_religious_beliefs").optional().isString().withMessage("Cultural/Religious Beliefs must be a string"),

  // Family Dynamics, Relationship with Parents, Importance of Family (must be strings)
  check("family_dynamics").optional().isString().withMessage("Family Dynamics must be a string"),
  check("relationship_with_parents").optional().isString().withMessage("Relationship with Parents must be a string"),
  check("importance_of_family").optional().isString().withMessage("Importance of Family must be a string"),
];

