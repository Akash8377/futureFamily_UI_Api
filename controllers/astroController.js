const pool = require('../services/db');

class AstroController {
  // Update Astro Details
  static async updateAstroDetails(req, res) {
    try {
      const userId = req.userId;
      const { birth_time, birth_city, manglik, nakshatra, rashi } = req.body;

      console.log('=== UPDATE ASTRO DETAILS ===');
      console.log('User ID:', userId);
      console.log('Data:', { birth_time, birth_city, manglik, nakshatra, rashi });

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (!birth_time || !birth_city) {
        return res.status(400).json({
          success: false,
          message: 'Birth time and city are required'
        });
      }

      // Check if user exists - using pool.query for mysql package
      const userCheck = await new Promise((resolve, reject) => {
        pool.query('SELECT id FROM users WHERE id = ?', [userId], (error, results) => {
          if (error) reject(error);
          else resolve(results);
        });
      });

      console.log('User check result:', userCheck);

      if (!userCheck || userCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: `User with ID ${userId} not found`
        });
      }

      // Check if profile exists
      const profileCheck = await new Promise((resolve, reject) => {
        pool.query('SELECT id FROM profile_data WHERE user_id = ?', [userId], (error, results) => {
          if (error) reject(error);
          else resolve(results);
        });
      });

      console.log('Profile check result:', profileCheck);

      let result;
      if (profileCheck && profileCheck.length > 0) {
        // Update existing record
        console.log('Updating existing profile...');
        result = await new Promise((resolve, reject) => {
          pool.query(
            `UPDATE profile_data SET 
             birth_time = ?, birth_city = ?, manglik = ?, nakshatra = ?, rashi = ?,
             updated_at = CURRENT_TIMESTAMP
             WHERE user_id = ?`,
            [birth_time, birth_city, manglik, nakshatra, rashi, userId],
            (error, results) => {
              if (error) reject(error);
              else resolve(results);
            }
          );
        });
      } else {
        // Insert new record
        console.log('Inserting new profile...');
        result = await new Promise((resolve, reject) => {
          pool.query(
            `INSERT INTO profile_data (
              user_id, birth_time, birth_city, manglik, nakshatra, rashi, 
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [userId, birth_time, birth_city, manglik, nakshatra, rashi],
            (error, results) => {
              if (error) reject(error);
              else resolve(results);
            }
          );
        });
      }

      console.log('Database operation result:', result);
      const affectedRows = result.affectedRows;

      if (affectedRows > 0) {
        res.status(200).json({
          success: true,
          message: 'Astro details updated successfully',
          user: {
            birth_time,
            birth_city,
            manglik,
            nakshatra,
            rashi
          },
          astro_details: {
            birth_time,
            birth_city,
            manglik,
            nakshatra,
            rashi
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'No changes made to astro details'
        });
      }

    } catch (error) {
      console.error('Update astro details error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error: ' + error.message
      });
    }
  }

  // Get Astro Details - Fixed for mysql package
  static async getAstroDetails(req, res) {
    try {
      const userId = req.userId;
      
      console.log('=== GET ASTRO DETAILS ===');
      console.log('User ID:', userId);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Fetch astro details from profile_data using promise wrapper
      const astroRows = await new Promise((resolve, reject) => {
        pool.query(
          `SELECT birth_time, birth_city, manglik, nakshatra, rashi
           FROM profile_data 
           WHERE user_id = ?`,
          [userId],
          (error, results) => {
            if (error) reject(error);
            else resolve(results);
          }
        );
      });

      console.log('Astro data result:', astroRows);

      // Default settings since astro_display_status column doesn't exist
      const settingsData = { 
        astro_display_status: 'visibleToALL' 
      };

      const astroData = astroRows && astroRows[0];

      if (!astroData) {
        console.log('No astro data found for user:', userId);
        return res.status(200).json({
          success: true,
          settings: settingsData,
          astro_details: {
            birth_time: "08:00",
            birth_city: "",
            manglik: "DontKnow",
            nakshatra: "",
            rashi: ""
          }
        });
      }

      res.status(200).json({
        success: true,
        settings: settingsData,
        astro_details: {
          birth_time: astroData.birth_time || "08:00",
          birth_city: astroData.birth_city || "",
          manglik: astroData.manglik || "DontKnow",
          nakshatra: astroData.nakshatra || "",
          rashi: astroData.rashi || ""
        }
      });

    } catch (error) {
      console.error('Get astro details error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error: ' + error.message
      });
    }
  }

  // Calculate Compatibility - Fixed for mysql package
  static async calculateCompatibility(req, res) {
    try {
      const { currentUserId, profileUserId } = req.body;

      if (!currentUserId || !profileUserId) {
        return res.status(400).json({
          success: false,
          message: 'Both currentUserId and profileUserId are required'
        });
      }

      // Fetch current user data
      const currentUserRows = await new Promise((resolve, reject) => {
        pool.query(
          `SELECT u.id, u.dob, pd.birth_time, pd.birth_city, pd.manglik, pd.nakshatra, pd.rashi 
           FROM users u 
           LEFT JOIN profile_data pd ON u.id = pd.user_id 
           WHERE u.id = ?`,
          [currentUserId],
          (error, results) => {
            if (error) reject(error);
            else resolve(results);
          }
        );
      });

      if (!currentUserRows || currentUserRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Current user not found'
        });
      }

      const currentUser = currentUserRows[0];

      // Fetch profile user data
      const profileUserRows = await new Promise((resolve, reject) => {
        pool.query(
          `SELECT u.id, u.first_name, u.last_name, u.dob, pd.birth_time, pd.birth_city, pd.manglik, pd.nakshatra, pd.rashi
           FROM users u 
           LEFT JOIN profile_data pd ON u.id = pd.user_id 
           WHERE u.id = ?`,
          [profileUserId],
          (error, results) => {
            if (error) reject(error);
            else resolve(results);
          }
        );
      });

      if (!profileUserRows || profileUserRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Profile user not found'
        });
      }

      const profileUser = profileUserRows[0];

      // Prepare response
      const response = {
        success: true,
        data: {
          profile: {
            user_id: profileUser.id,
            first_name: profileUser.first_name,
            last_name: profileUser.last_name,
            rashi: profileUser.rashi,
            nakshatra: profileUser.nakshatra,
            manglik: profileUser.manglik,
            dob: profileUser.dob,
            birth_time: profileUser.birth_time,
            birth_city: profileUser.birth_city
          },
          compatibility: {
            score: 75, // Default score
            isCompatible: true,
            details: {
              rashi_match: "Good",
              nakshatra_match: "Moderate",
              manglik_match: "Compatible"
            }
          }
        }
      };

      res.json(response);

    } catch (error) {
      console.error('Error in calculateCompatibility:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = AstroController;

//update by id