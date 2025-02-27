const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userController = require("../controllers/user");
const onboardingController = require("../controllers/onboarding");
const userProfileController = require("../controllers/userProfile");
const userFilterController = require("../controllers/userFilter");
const userPersonalityController = require("../controllers/userPersonality");
const userShortlistController = require("../controllers/userShortlist");
const userMaybelistController = require("../controllers/maybeList");
const { check } = require("express-validator"); // Add this import
const fileController = require("../controllers/file.controller");
const messageListingController = require("../controllers/messageListingController");

const {
  loginUpValidataion,
  signupValidation,
  onboardValidation,
  userProfileDataValidation,
} = require("../helper/validation");

//user login/signup routes
router.post("/signup", signupValidation, userController.signup);
router.post("/onboarding", onboardValidation, onboardingController.onboarding);
router.post("/login", loginUpValidataion, userController.getUserLogin);
router.get(
  "/get-login",
  auth.verifyToken,
  loginUpValidataion,
  userController.getLogin
);
router.get("/welcome", auth.verifyToken, userController.welcome);
router.post("/logout", auth.verifyToken, userController.logout);

//user Profile routes
router.post(
  "/add-profile",
  auth.verifyToken,
  userProfileDataValidation,
  userProfileController.add_user_profile
);
router.get("/edit-profile", auth.verifyToken, userProfileController.edit);
router.put("/update-profile", auth.verifyToken, userProfileController.update);

//user Filter routes
router.post(
  "/filter-users",
  auth.verifyToken,
  userFilterController.filter_users
);
router.get(
  "/apply-last-filter",
  auth.verifyToken,
  userFilterController.apply_last_filter
);
router.get("/get-user/:userId", auth.verifyToken, userFilterController.get_user_details);

// save user personality response
router.post(
  "/user-personality/:userId",
  userPersonalityController.savePersonalityResponses
)
  router.get(
    "/get-user-personality/:userId",
    userPersonalityController.getPersonalityResponses
);
router.get(
  "/get-personality-report/:userId",
  userPersonalityController.getPersonalityReport
);
//Shortlist route
router.post("/shortlist", auth.verifyToken, userShortlistController.shortlistUser);

router.get("/notifications", auth.verifyToken, userShortlistController.getNotifications);
router.get("/getFullNotifications", auth.verifyToken, userFilterController.getNotificationsUsers);


router.get("/shortlisted", auth.verifyToken, userFilterController.getShortlistedUsers);
router.post("/add-maybe", auth.verifyToken, userMaybelistController.maybeUser);
router.get("/maybe", auth.verifyToken, userFilterController.getMaybeUsers);
router.delete("/blacktlisted", auth.verifyToken, userShortlistController.blacklistUser);
// Remove a shortlisted user
router.delete("/remove-maybe", auth.verifyToken, userMaybelistController.removeMaybeUser);
router.delete("/remove-shortlist", auth.verifyToken, userShortlistController.removeShortlistedUser);

//file upload route
router.post("/upload", fileController.upload);

//message-listing 
router.get("/message-listing", auth.verifyToken, messageListingController.getMessageListing);

module.exports = router; // export to use in server.js
