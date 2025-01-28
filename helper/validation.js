const { check } = require("express-validator");


exports.loginUpValidataion = [
  check("email", "Email is required")
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: true }),
  check("password", "Password is required").not().isEmpty(),
];


// Signup Validation
exports.signupValidation = [
  check("gender", "Gender is required").not().isEmpty(),
  check("looking_for", "Looking For is required").not().isEmpty(),
  check("email", "Email is required")
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: true }),
  check("password", "Password must be at least 6 characters long")
    .isLength({ min: 6 }),
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
    check("personality_type", "Personality Type is required").not().isEmpty(),
];


// exports.rideValidation = [
//   check("vehicle_id", "Vehicle ID is required").isInt(),
//   check("service_type", "Service Type is required").not().isEmpty(),
//   check("pickup_date", "Pickup Date is required").isDate(),
//   check("pickup_time", "Pickup Time is required").not().isEmpty(),
//   check("pickup_location", "Pickup Location is required").not().isEmpty(),
//   check("dropoff_location", "Dropoff Location is required").not().isEmpty(),
//   check("passengers", "Number of Passengers is required").isInt(),
// ];


