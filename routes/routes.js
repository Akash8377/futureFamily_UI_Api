const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userController = require("../controllers/user");
const onboardingController = require("../controllers/onboarding");
const userProfileController = require("../controllers/userProfile");
const { check } = require("express-validator"); // Add this import



const { 
  loginUpValidataion,
  signupValidation,
  onboardValidation,
  userProfileValidation
} = require("../helper/validation");




//user login/signup routes
router.post("/signup", signupValidation, userController.signup);
router.post("/onboarding", onboardValidation, onboardingController.onboarding );
router.post("/login", loginUpValidataion, userController.getUserLogin);
router.get("/welcome", auth.verifyToken, userController.welcome);
router.post("/logout", userController.logout);

//user Profile routes
router.post("/add-profile", userProfileValidation, userProfileController.add_user_profile );
router.get("/edit-profile/:user_id", auth.verifyToken, userProfileController.edit);
router.put("/update-profile/:user_id", auth.verifyToken, userProfileController.update);

module.exports = router; // export to use in server.js
