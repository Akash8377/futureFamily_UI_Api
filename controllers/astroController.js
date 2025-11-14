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

      // Calculate comprehensive compatibility matching futuresoulmate format
      const compatibilityResult = AstroController.calculateComprehensiveCompatibility(currentUser, profileUser);

      // Prepare response matching futuresoulmate structure
      const response = {
        success: true,
        data: {
          profile: {
            user_id: profileUser.id,
            first_name: profileUser.first_name,
            last_name: profileUser.last_name,
            profile_image: profileUser.profile_image || null,
            rashi: profileUser.rashi,
            nakshatra: profileUser.nakshatra,
            manglik: profileUser.manglik,
            dob: profileUser.dob,
            birth_time: profileUser.birth_time || "Not Provided",
            birth_city: profileUser.birth_city || "Not Provided"
          },
          compatibility: {
            score: compatibilityResult.overall,
            details: compatibilityResult,
            interpretation: compatibilityResult.interpretation,
            isCompatible: compatibilityResult.isCompatible,
            totalPoints: compatibilityResult.totalPoints
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

  // Comprehensive compatibility calculation matching futuresoulmate format
  static calculateComprehensiveCompatibility(currentUser, profileUser) {
    // Calculate traditional (kundli) points
    const traditional = AstroController.calculateTraditionalCompatibility(currentUser, profileUser);
    
    // Calculate modern compatibility points
    const modern = AstroController.calculateModernCompatibility(currentUser, profileUser);
    
    // Calculate overall score (weighted average)
    const traditionalScore = traditional.totalScore;
    const modernScore = modern.totalScore;
    const overallScore = Math.round((traditionalScore + modernScore) / 2);
    
    // Determine interpretation
    const interpretation = AstroController.getInterpretation(overallScore);
    
    return {
      overall: overallScore,
      interpretation: interpretation,
      isCompatible: overallScore >= 60,
      traditional: traditional,
      modern: modern,
      totalPoints: {
        traditional: `${traditional.totalScore}/${traditional.maxScore}`,
        modern: `${modern.totalScore}/${modern.maxScore}`
      }
    };
  }

  // Traditional (Kundli) Compatibility Calculation
  static calculateTraditionalCompatibility(currentUser, profileUser) {
    const aspects = {
      Varna: { score: AstroController.calculateVarna(currentUser, profileUser), max: 1, description: "Spiritual Compatibility" },
      Vashya: { score: AstroController.calculateVashya(currentUser, profileUser), max: 2, description: "Mutual Attraction" },
      Tara: { score: AstroController.calculateTara(currentUser, profileUser), max: 3, description: "Destiny Compatibility" },
      Yoni: { score: AstroController.calculateYoni(currentUser, profileUser), max: 4, description: "Physical Compatibility" },
      GrahaMaitri: { score: AstroController.calculateGrahaMaitri(currentUser, profileUser), max: 5, description: "Mental Compatibility" },
      Gana: { score: AstroController.calculateGana(currentUser, profileUser), max: 6, description: "Temperament Compatibility" },
      Bhakoot: { score: AstroController.calculateBhakoot(currentUser, profileUser), max: 7, description: "Prosperity Compatibility" },
      Nadi: { score: AstroController.calculateNadi(currentUser, profileUser), max: 8, description: "Health Compatibility" }
    };

    const totalScore = Object.values(aspects).reduce((sum, aspect) => sum + aspect.score, 0);
    const maxScore = Object.values(aspects).reduce((sum, aspect) => sum + aspect.max, 0);

    return {
      ...aspects,
    //   totalScore,
    //   maxScore,
      isCompatible: totalScore >= 18 // At least 50% compatibility
    };
  }

  // Fixed Modern Compatibility Calculation - Only these 8 specific metrics
  static calculateModernCompatibility(currentUser, profileUser) {
    const aspects = {
      Work: { score: AstroController.calculateWorkCompatibility(currentUser, profileUser), max: 1 },
      Influence: { score: AstroController.calculateInfluenceCompatibility(currentUser, profileUser), max: 2 },
      Destiny: { score: AstroController.calculateDestinyCompatibility(currentUser, profileUser), max: 3 },
      Mentality: { score: AstroController.calculateMentalityCompatibility(currentUser, profileUser), max: 4 },
      Compatibility: { score: AstroController.calculateCompatibilityScore(currentUser, profileUser), max: 5 },
      Temperament: { score: AstroController.calculateTemperamentCompatibility(currentUser, profileUser), max: 6 },
      Love: { score: AstroController.calculateLoveCompatibility(currentUser, profileUser), max: 7 },
      Health: { score: AstroController.calculateHealthCompatibility(currentUser, profileUser), max: 8 }
    };

    // Add these missing calculations
    const totalScore = Object.values(aspects).reduce((sum, aspect) => sum + aspect.score, 0);
    const maxScore = Object.values(aspects).reduce((sum, aspect) => sum + aspect.max, 0);

    return {
      ...aspects,
    //   totalScore,
    //   maxScore
    };
  }

  // Individual traditional aspect calculations
  static calculateVarna(currentUser, profileUser) {
    // Simplified Varna calculation based on rashi
    const varnaMap = {
      'Aries (Mesh)': 1, 'Leo (Singh)': 1, 'Sagittarius (Dhanu)': 1, // Kshatriya
      'Taurus (Vrishabh)': 2, 'Virgo (Kanya)': 2, 'Capricorn (Makar)': 2, // Vaishya
      'Gemini (Mithun)': 3, 'Libra (Tula)': 3, 'Aquarius (Kumbh)': 3, // Brahmin
      'Cancer (Kark)': 4, 'Scorpio (Vrishchik)': 4, 'Pisces (Meen)': 4  // Shudra
    };
    
    const varna1 = varnaMap[currentUser.rashi] || 0;
    const varna2 = varnaMap[profileUser.rashi] || 0;
    
    return Math.abs(varna1 - varna2) <= 1 ? 1 : 0;
  }

  static calculateVashya(currentUser, profileUser) {
    // Mutual attraction based on rashi compatibility
    const compatiblePairs = {
      'Aries (Mesh)': ['Leo (Singh)', 'Sagittarius (Dhanu)'],
      'Taurus (Vrishabh)': ['Virgo (Kanya)', 'Capricorn (Makar)'],
      'Gemini (Mithun)': ['Libra (Tula)', 'Aquarius (Kumbh)'],
      'Cancer (Kark)': ['Scorpio (Vrishchik)', 'Pisces (Meen)'],
      'Leo (Singh)': ['Aries (Mesh)', 'Sagittarius (Dhanu)'],
      'Virgo (Kanya)': ['Taurus (Vrishabh)', 'Capricorn (Makar)'],
      'Libra (Tula)': ['Gemini (Mithun)', 'Aquarius (Kumbh)'],
      'Scorpio (Vrishchik)': ['Cancer (Kark)', 'Pisces (Meen)'],
      'Sagittarius (Dhanu)': ['Aries (Mesh)', 'Leo (Singh)'],
      'Capricorn (Makar)': ['Taurus (Vrishabh)', 'Virgo (Kanya)'],
      'Aquarius (Kumbh)': ['Gemini (Mithun)', 'Libra (Tula)'],
      'Pisces (Meen)': ['Cancer (Kark)', 'Scorpio (Vrishchik)']
    };
    
    if (currentUser.rashi === profileUser.rashi) return 2;
    if (compatiblePairs[currentUser.rashi]?.includes(profileUser.rashi)) return 1;
    return 0;
  }

  static calculateTara(currentUser, profileUser) {
    // Destiny compatibility - simplified
    return currentUser.nakshatra && profileUser.nakshatra ? 
      (Math.random() > 0.3 ? 3 : 1) : 0;
  }

  static calculateYoni(currentUser, profileUser) {
    // Physical compatibility based on nakshatra
    return currentUser.nakshatra && profileUser.nakshatra ? 
      (Math.random() > 0.4 ? 4 : 2) : 1;
  }

  static calculateGrahaMaitri(currentUser, profileUser) {
    // Mental compatibility
    return currentUser.rashi && profileUser.rashi ? 
      (Math.random() > 0.2 ? 5 : 3) : 2;
  }

  static calculateGana(currentUser, profileUser) {
    // Temperament compatibility
    const ganaMap = {
      'Dev': ['Ashwini', 'Mrigashira', 'Punarvasu', 'Pushya', 'Hasta', 'Swati', 'Anuradha', 'Shravana', 'Revati'],
      'Manushya': ['Bharani', 'Rohini', 'Ardra', 'Purva Phalguni', 'Uttara Phalguni', 'Purva Ashadha', 'Uttara Ashadha', 'Purva Bhadrapada'],
      'Rakshasa': ['Krittika', 'Ashlesha', 'Magha', 'Chitra', 'Vishakha', 'Jyeshtha', 'Mula', 'Dhanishta', 'Shatabhisha']
    };
    
    let gana1, gana2;
    for (const [gana, nakshatras] of Object.entries(ganaMap)) {
      if (nakshatras.includes(currentUser.nakshatra)) gana1 = gana;
      if (nakshatras.includes(profileUser.nakshatra)) gana2 = gana;
    }
    
    if (gana1 === gana2) return 6;
    if ((gana1 === 'Dev' && gana2 === 'Manushya') || (gana1 === 'Manushya' && gana2 === 'Dev')) return 4;
    return 0;
  }

  static calculateBhakoot(currentUser, profileUser) {
    // Prosperity compatibility based on rashi
    const compatibleBhakoot = {
      'Aries (Mesh)': ['Cancer (Kark)', 'Scorpio (Vrishchik)', 'Pisces (Meen)'],
      'Taurus (Vrishabh)': ['Leo (Singh)', 'Sagittarius (Dhanu)', 'Aries (Mesh)'],
      'Gemini (Mithun)': ['Virgo (Kanya)', 'Capricorn (Makar)', 'Taurus (Vrishabh)'],
      'Cancer (Kark)': ['Libra (Tula)', 'Aquarius (Kumbh)', 'Gemini (Mithun)'],
      'Leo (Singh)': ['Scorpio (Vrishchik)', 'Pisces (Meen)', 'Cancer (Kark)'],
      'Virgo (Kanya)': ['Sagittarius (Dhanu)', 'Aries (Mesh)', 'Leo (Singh)'],
      'Libra (Tula)': ['Capricorn (Makar)', 'Taurus (Vrishabh)', 'Virgo (Kanya)'],
      'Scorpio (Vrishchik)': ['Aquarius (Kumbh)', 'Gemini (Mithun)', 'Libra (Tula)'],
      'Sagittarius (Dhanu)': ['Pisces (Meen)', 'Cancer (Kark)', 'Scorpio (Vrishchik)'],
      'Capricorn (Makar)': ['Aries (Mesh)', 'Leo (Singh)', 'Sagittarius (Dhanu)'],
      'Aquarius (Kumbh)': ['Taurus (Vrishabh)', 'Virgo (Kanya)', 'Capricorn (Makar)'],
      'Pisces (Meen)': ['Gemini (Mithun)', 'Libra (Tula)', 'Aquarius (Kumbh)']
    };
    
    return compatibleBhakoot[currentUser.rashi]?.includes(profileUser.rashi) ? 7 : 0;
  }

  static calculateNadi(currentUser, profileUser) {
    // Health compatibility
    const nadiMap = {
      'Adi': ['Ashwini', 'Ardra', 'Punarvasu', 'Uttara Phalguni', 'Hasta', 'Jyeshtha', 'Mula', 'Satabhisha', 'Purva Bhadrapada'],
      'Madhya': ['Bharani', 'Mrignshira', 'Pushya', 'Purva Phalguni', 'Chitra', 'Anuradha', 'Purva Ashadha', 'Dhanishta', 'Uttara Bhadrapada'],
      'Antya': ['Krittika', 'Rohini', 'Ashlesha', 'Magha', 'Swati', 'Vishakha', 'Uttara Ashadha', 'Shravana', 'Revati']
    };
    
    let nadi1, nadi2;
    for (const [nadi, nakshatras] of Object.entries(nadiMap)) {
      if (nakshatras.includes(currentUser.nakshatra)) nadi1 = nadi;
      if (nakshatras.includes(profileUser.nakshatra)) nadi2 = nadi;
    }
    
    return nadi1 !== nadi2 ? 8 : 0;
  }

  // Fixed modern compatibility calculations - now properly using user data
  static calculateWorkCompatibility(currentUser, profileUser) {
    // Work compatibility based on rashi elements
    const elementCompatibility = {
      'Fire': ['Fire', 'Air'],    // Aries, Leo, Sagittarius
      'Earth': ['Earth', 'Water'], // Taurus, Virgo, Capricorn
      'Air': ['Air', 'Fire'],     // Gemini, Libra, Aquarius
      'Water': ['Water', 'Earth'] // Cancer, Scorpio, Pisces
    };

    const rashiElements = {
      'Aries (Mesh)': 'Fire',
      'Taurus (Vrishabh)': 'Earth',
      'Gemini (Mithun)': 'Air',
      'Cancer (Kark)': 'Water',
      'Leo (Singh)': 'Fire',
      'Virgo (Kanya)': 'Earth',
      'Libra (Tula)': 'Air',
      'Scorpio (Vrishchik)': 'Water',
      'Sagittarius (Dhanu)': 'Fire',
      'Capricorn (Makar)': 'Earth',
      'Aquarius (Kumbh)': 'Air',
      'Pisces (Meen)': 'Water'
    };

    const element1 = rashiElements[currentUser.rashi];
    const element2 = rashiElements[profileUser.rashi];

    if (!element1 || !element2) return 0;
    
    if (element1 === element2) return 1; // Same element - best compatibility
    if (elementCompatibility[element1]?.includes(element2)) return 1; // Compatible elements
    
    return 0; // Incompatible elements
  }

  static calculateInfluenceCompatibility(currentUser, profileUser) {
    // Influence based on planetary rulers
    const planetaryInfluence = {
      'Aries (Mesh)': 'Mars',
      'Taurus (Vrishabh)': 'Venus',
      'Gemini (Mithun)': 'Mercury',
      'Cancer (Kark)': 'Moon',
      'Leo (Singh)': 'Sun',
      'Virgo (Kanya)': 'Mercury',
      'Libra (Tula)': 'Venus',
      'Scorpio (Vrishchik)': 'Mars',
      'Sagittarius (Dhanu)': 'Jupiter',
      'Capricorn (Makar)': 'Saturn',
      'Aquarius (Kumbh)': 'Saturn',
      'Pisces (Meen)': 'Jupiter'
    };

    const planet1 = planetaryInfluence[currentUser.rashi];
    const planet2 = planetaryInfluence[profileUser.rashi];

    if (!planet1 || !planet2) return 1;

    // Friendly planets get higher score
    const friendlyPlanets = {
      'Sun': ['Moon', 'Mars', 'Jupiter'],
      'Moon': ['Sun', 'Mercury'],
      'Mars': ['Sun', 'Moon', 'Jupiter'],
      'Mercury': ['Sun', 'Venus'],
      'Jupiter': ['Sun', 'Moon', 'Mars'],
      'Venus': ['Mercury', 'Saturn'],
      'Saturn': ['Venus', 'Mercury']
    };

    if (planet1 === planet2) return 2; // Same planet - strong influence
    if (friendlyPlanets[planet1]?.includes(planet2)) return 2; // Friendly planets
    
    return 1; // Neutral influence
  }

  static calculateDestinyCompatibility(currentUser, profileUser) {
    // Destiny based on nakshatra compatibility
    if (!currentUser.nakshatra || !profileUser.nakshatra) return 1;

    const nakshatraGroups = {
      'Dev': ['Ashwini', 'Mrigashira', 'Punarvasu', 'Pushya', 'Hasta', 'Swati', 'Anuradha', 'Shravana', 'Revati'],
      'Manushya': ['Bharani', 'Rohini', 'Ardra', 'Purva Phalguni', 'Uttara Phalguni', 'Purva Ashadha', 'Uttara Ashadha', 'Purva Bhadrapada'],
      'Rakshasa': ['Krittika', 'Ashlesha', 'Magha', 'Chitra', 'Vishakha', 'Jyeshtha', 'Mula', 'Dhanishta', 'Shatabhisha']
    };

    let group1, group2;
    for (const [group, nakshatras] of Object.entries(nakshatraGroups)) {
      if (nakshatras.includes(currentUser.nakshatra)) group1 = group;
      if (nakshatras.includes(profileUser.nakshatra)) group2 = group;
    }

    if (group1 === group2) return 3; // Same group - strong destiny connection
    if ((group1 === 'Dev' && group2 === 'Manushya') || (group1 === 'Manushya' && group2 === 'Dev')) return 2; // Compatible groups
    
    return 1; // Challenging destiny connection
  }

  // New calculation methods for the specific 8 metrics
  static calculateMentalityCompatibility(currentUser, profileUser) {
    // Mentality compatibility based on intellectual and emotional alignment
    const mentalityScore = AstroController.calculateIntellectualCompatibility(currentUser, profileUser) + 
                          AstroController.calculateEmotionalCompatibility(currentUser, profileUser);
    
    // Normalize to max of 4 (since intellectual max is 6 and emotional max is 5)
    return Math.min(Math.round(mentalityScore / 2.75), 4);
  }

  static calculateCompatibilityScore(currentUser, profileUser) {
    // Overall compatibility score based on multiple factors
    let compatibilityScore = 0;
    
    // Rashi compatibility (30%)
    const rashiCompatibility = currentUser.rashi === profileUser.rashi ? 1.5 : 0.5;
    compatibilityScore += rashiCompatibility;
    
    // Nakshatra compatibility (30%)
    const nakshatraCompatibility = currentUser.nakshatra && profileUser.nakshatra ? 
      (currentUser.nakshatra === profileUser.nakshatra ? 1.5 : 0.8) : 0.3;
    compatibilityScore += nakshatraCompatibility;
    
    // Manglik compatibility (20%)
    const manglikCompatibility = AstroController.calculateManglikModernCompatibility(currentUser.manglik, profileUser.manglik);
    compatibilityScore += manglikCompatibility;
    
    // Element compatibility (20%)
    const elementCompatibility = AstroController.calculateElementHarmony(currentUser.rashi, profileUser.rashi);
    compatibilityScore += elementCompatibility;
    
    // Convert to 1-5 scale
    return Math.min(Math.round(compatibilityScore), 5);
  }

  static calculateTemperamentCompatibility(currentUser, profileUser) {
    // Temperament based on Gana and emotional nature
    const ganaScore = AstroController.calculateGana(currentUser, profileUser);
    const emotionalScore = AstroController.calculateEmotionalCompatibility(currentUser, profileUser);
    
    // Convert to 1-6 scale (Gana max is 6, Emotional max is 5)
    return Math.min(Math.round((ganaScore + emotionalScore) / 1.83), 6);
  }

  static calculateLoveCompatibility(currentUser, profileUser) {
    // Love compatibility based on Venus influence and emotional connection
    const venusSigns = ['Taurus (Vrishabh)', 'Libra (Tula)'];
    const marsSigns = ['Aries (Mesh)', 'Scorpio (Vrishchik)'];
    
    let loveScore = 0;
    
    // Venus influence (romantic compatibility)
    if (venusSigns.includes(currentUser.rashi) || venusSigns.includes(profileUser.rashi)) {
      loveScore += 2;
    }
    
    // Mars influence (passion)
    if (marsSigns.includes(currentUser.rashi) || marsSigns.includes(profileUser.rashi)) {
      loveScore += 2;
    }
    
    // Emotional compatibility
    const emotionalScore = AstroController.calculateEmotionalCompatibility(currentUser, profileUser);
    loveScore += Math.round(emotionalScore / 1.25); // Convert from 5 to 4 scale
    
    // Rashi harmony
    const rashiHarmony = AstroController.calculateRashiHarmony(currentUser.rashi, profileUser.rashi);
    loveScore += rashiHarmony;
    
    return Math.min(loveScore, 7);
  }

  static calculateHealthCompatibility(currentUser, profileUser) {
    // Health compatibility based on Nadi and physical factors
    const nadiScore = AstroController.calculateNadi(currentUser, profileUser);
    const physicalScore = AstroController.calculatePhysicalCompatibility(currentUser, profileUser);
    
    // Convert to 1-8 scale (Nadi max is 8, Physical max is 8)
    return Math.min(Math.round((nadiScore + physicalScore) / 2), 8);
  }

  // Helper methods for the new calculations
  static calculateManglikModernCompatibility(manglik1, manglik2) {
    if (!manglik1 || !manglik2) return 0.5;
    
    const manglikStatus = {
      'Non-Manglik': 0,
      'Manglik': 1,
      'Partial-Manglik': 0.5,
      'DontKnow': 0.25
    };

    const score1 = manglikStatus[manglik1] || 0;
    const score2 = manglikStatus[manglik2] || 0;

    // Both non-manglik - best case
    if (score1 === 0 && score2 === 0) return 1;
    // Both manglik - also acceptable
    if (score1 === 1 && score2 === 1) return 0.8;
    // One manglik, one non-manglik - moderate
    if ((score1 === 1 && score2 === 0) || (score1 === 0 && score2 === 1)) return 0.3;
    
    return 0.5;
  }

  static calculateElementHarmony(rashi1, rashi2) {
    if (!rashi1 || !rashi2) return 0.5;
    
    const rashiElements = {
      'Aries (Mesh)': 'Fire',
      'Taurus (Vrishabh)': 'Earth',
      'Gemini (Mithun)': 'Air',
      'Cancer (Kark)': 'Water',
      'Leo (Singh)': 'Fire',
      'Virgo (Kanya)': 'Earth',
      'Libra (Tula)': 'Air',
      'Scorpio (Vrishchik)': 'Water',
      'Sagittarius (Dhanu)': 'Fire',
      'Capricorn (Makar)': 'Earth',
      'Aquarius (Kumbh)': 'Air',
      'Pisces (Meen)': 'Water'
    };

    const element1 = rashiElements[rashi1];
    const element2 = rashiElements[rashi2];

    if (!element1 || !element2) return 0.5;

    // Same element - best harmony
    if (element1 === element2) return 1;
    
    // Compatible elements
    const compatiblePairs = {
      'Fire': ['Air'],
      'Air': ['Fire'],
      'Water': ['Earth'],
      'Earth': ['Water']
    };
    
    if (compatiblePairs[element1]?.includes(element2)) return 0.8;
    
    // Challenging elements
    return 0.3;
  }

  static calculateRashiHarmony(rashi1, rashi2) {
    if (!rashi1 || !rashi2) return 1;
    
    // Highly compatible rashis
    const highlyCompatible = {
      'Aries (Mesh)': ['Leo (Singh)', 'Sagittarius (Dhanu)'],
      'Taurus (Vrishabh)': ['Virgo (Kanya)', 'Capricorn (Makar)'],
      'Gemini (Mithun)': ['Libra (Tula)', 'Aquarius (Kumbh)'],
      'Cancer (Kark)': ['Scorpio (Vrishchik)', 'Pisces (Meen)'],
      'Leo (Singh)': ['Aries (Mesh)', 'Sagittarius (Dhanu)'],
      'Virgo (Kanya)': ['Taurus (Vrishabh)', 'Capricorn (Makar)'],
      'Libra (Tula)': ['Gemini (Mithun)', 'Aquarius (Kumbh)'],
      'Scorpio (Vrishchik)': ['Cancer (Kark)', 'Pisces (Meen)'],
      'Sagittarius (Dhanu)': ['Aries (Mesh)', 'Leo (Singh)'],
      'Capricorn (Makar)': ['Taurus (Vrishabh)', 'Virgo (Kanya)'],
      'Aquarius (Kumbh)': ['Gemini (Mithun)', 'Libra (Tula)'],
      'Pisces (Meen)': ['Cancer (Kark)', 'Scorpio (Vrishchik)']
    };
    
    if (rashi1 === rashi2) return 2; // Same rashi
    if (highlyCompatible[rashi1]?.includes(rashi2)) return 2; // Highly compatible
    return 1; // Neutral
  }

  // Existing modern compatibility calculations
  static calculateFinanceCompatibility(currentUser, profileUser) {
    // Finance compatibility based on rashi attributes
    const financialCompatibility = {
      'Aries (Mesh)': 2,    // Entrepreneurial
      'Taurus (Vrishabh)': 3, // Stable with money
      'Gemini (Mithun)': 1,  // Variable income
      'Cancer (Kark)': 2,    // Emotional spending
      'Leo (Singh)': 2,      // Lavish spender
      'Virgo (Kanya)': 3,    // Practical with money
      'Libra (Tula)': 2,     // Balanced approach
      'Scorpio (Vrishchik)': 3, // Good with investments
      'Sagittarius (Dhanu)': 1, // Risk taker
      'Capricorn (Makar)': 3,  // Excellent money management
      'Aquarius (Kumbh)': 2,   // Unconventional approach
      'Pisces (Meen)': 1       // Generous spender
    };

    const score1 = financialCompatibility[currentUser.rashi] || 1;
    const score2 = financialCompatibility[profileUser.rashi] || 1;

    // Calculate average financial compatibility
    const averageScore = Math.round((score1 + score2) / 2);
    
    return Math.min(averageScore, 3);
  }

  static calculateCommunicationCompatibility(currentUser, profileUser) {
    // Communication based on rashi communication styles
    const communicationStyles = {
      'Air': 4, // Gemini, Libra, Aquarius - excellent communicators
      'Fire': 3, // Aries, Leo, Sagittarius - expressive
      'Water': 2, // Cancer, Scorpio, Pisces - emotional communicators
      'Earth': 2  // Taurus, Virgo, Capricorn - practical communicators
    };

    const rashiElements = {
      'Aries (Mesh)': 'Fire',
      'Taurus (Vrishabh)': 'Earth',
      'Gemini (Mithun)': 'Air',
      'Cancer (Kark)': 'Water',
      'Leo (Singh)': 'Fire',
      'Virgo (Kanya)': 'Earth',
      'Libra (Tula)': 'Air',
      'Scorpio (Vrishchik)': 'Water',
      'Sagittarius (Dhanu)': 'Fire',
      'Capricorn (Makar)': 'Earth',
      'Aquarius (Kumbh)': 'Air',
      'Pisces (Meen)': 'Water'
    };

    const element1 = rashiElements[currentUser.rashi];
    const element2 = rashiElements[profileUser.rashi];

    if (!element1 || !element2) return 2;

    const style1 = communicationStyles[element1] || 2;
    const style2 = communicationStyles[element2] || 2;

    // Air signs communicate best with other Air and Fire signs
    if ((element1 === 'Air' && element2 === 'Air') || 
        (element1 === 'Air' && element2 === 'Fire') ||
        (element1 === 'Fire' && element2 === 'Air')) {
      return 4;
    }

    // Calculate average communication score
    return Math.min(Math.round((style1 + style2) / 2), 4);
  }

  static calculateEmotionalCompatibility(currentUser, profileUser) {
    // Emotional compatibility based on moon signs (simplified using rashi)
    const emotionalNature = {
      'Water': 5, // Cancer, Scorpio, Pisces - highly emotional
      'Fire': 4,  // Aries, Leo, Sagittarius - passionate
      'Earth': 3, // Taurus, Virgo, Capricorn - stable emotions
      'Air': 2    // Gemini, Libra, Aquarius - intellectual over emotional
    };

    const rashiElements = {
      'Aries (Mesh)': 'Fire',
      'Taurus (Vrishabh)': 'Earth',
      'Gemini (Mithun)': 'Air',
      'Cancer (Kark)': 'Water',
      'Leo (Singh)': 'Fire',
      'Virgo (Kanya)': 'Earth',
      'Libra (Tula)': 'Air',
      'Scorpio (Vrishchik)': 'Water',
      'Sagittarius (Dhanu)': 'Fire',
      'Capricorn (Makar)': 'Earth',
      'Aquarius (Kumbh)': 'Air',
      'Pisces (Meen)': 'Water'
    };

    const element1 = rashiElements[currentUser.rashi];
    const element2 = rashiElements[profileUser.rashi];

    if (!element1 || !element2) return 3;

    const emotional1 = emotionalNature[element1] || 3;
    const emotional2 = emotionalNature[element2] || 3;

    // Water signs connect well emotionally with other Water and Earth signs
    if ((element1 === 'Water' && element2 === 'Water') ||
        (element1 === 'Water' && element2 === 'Earth') ||
        (element1 === 'Earth' && element2 === 'Water')) {
      return 5;
    }

    // Calculate emotional compatibility
    return Math.min(Math.round((emotional1 + emotional2) / 2), 5);
  }

  static calculateIntellectualCompatibility(currentUser, profileUser) {
    // Intellectual compatibility
    const intellectualLevel = {
      'Air': 6,  // Gemini, Libra, Aquarius - highly intellectual
      'Fire': 4, // Aries, Leo, Sagittarius - creative thinkers
      'Earth': 3, // Taurus, Virgo, Capricorn - practical thinkers
      'Water': 2  // Cancer, Scorpio, Pisces - intuitive thinkers
    };

    const rashiElements = {
      'Aries (Mesh)': 'Fire',
      'Taurus (Vrishabh)': 'Earth',
      'Gemini (Mithun)': 'Air',
      'Cancer (Kark)': 'Water',
      'Leo (Singh)': 'Fire',
      'Virgo (Kanya)': 'Earth',
      'Libra (Tula)': 'Air',
      'Scorpio (Vrishchik)': 'Water',
      'Sagittarius (Dhanu)': 'Fire',
      'Capricorn (Makar)': 'Earth',
      'Aquarius (Kumbh)': 'Air',
      'Pisces (Meen)': 'Water'
    };

    const element1 = rashiElements[currentUser.rashi];
    const element2 = rashiElements[profileUser.rashi];

    if (!element1 || !element2) return 3;

    const intellect1 = intellectualLevel[element1] || 3;
    const intellect2 = intellectualLevel[element2] || 3;

    // Air signs have strongest intellectual compatibility with other Air signs
    if (element1 === 'Air' && element2 === 'Air') {
      return 6;
    }

    // Air and Fire have good intellectual synergy
    if ((element1 === 'Air' && element2 === 'Fire') || 
        (element1 === 'Fire' && element2 === 'Air')) {
      return 5;
    }

    return Math.min(Math.round((intellect1 + intellect2) / 2), 6);
  }

  static calculatePhysicalCompatibility(currentUser, profileUser) {
    // Physical compatibility based on multiple factors
    let physicalScore = 0;

    // 1. Rashi compatibility for physical attraction (max 3 points)
    const physicalRashis = {
      'Fire': 3,  // Aries, Leo, Sagittarius - high physical energy
      'Water': 2, // Cancer, Scorpio, Pisces - sensual
      'Earth': 2, // Taurus, Virgo, Capricorn - physical stability
      'Air': 1    // Gemini, Libra, Aquarius - less physical focus
    };

    const rashiElements = {
      'Aries (Mesh)': 'Fire',
      'Taurus (Vrishabh)': 'Earth',
      'Gemini (Mithun)': 'Air',
      'Cancer (Kark)': 'Water',
      'Leo (Singh)': 'Fire',
      'Virgo (Kanya)': 'Earth',
      'Libra (Tula)': 'Air',
      'Scorpio (Vrishchik)': 'Water',
      'Sagittarius (Dhanu)': 'Fire',
      'Capricorn (Makar)': 'Earth',
      'Aquarius (Kumbh)': 'Air',
      'Pisces (Meen)': 'Water'
    };

    const element1 = rashiElements[currentUser.rashi];
    const element2 = rashiElements[profileUser.rashi];

    if (element1 && element2) {
      const physical1 = physicalRashis[element1] || 1;
      const physical2 = physicalRashis[element2] || 1;
      physicalScore += Math.round((physical1 + physical2) / 2);
    }

    // 2. Yoni compatibility from traditional calculation (max 3 points)
    const yoniScore = AstroController.calculateYoni(currentUser, profileUser);
    physicalScore += Math.min(Math.round(yoniScore / 4 * 3), 3);

    // 3. Nadi compatibility for health (max 2 points)
    const nadiScore = AstroController.calculateNadi(currentUser, profileUser);
    physicalScore += nadiScore === 8 ? 2 : 0;

    return Math.min(physicalScore, 8);
  }

  static getInterpretation(score) {
    if (score >= 80) return "Excellent Compatibility";
    if (score >= 70) return "Very Good Compatibility";
    if (score >= 60) return "Good Compatibility";
    if (score >= 50) return "Moderate Compatibility";
    if (score >= 40) return "Fair Compatibility";
    return "Low Compatibility";
  }
}

module.exports = AstroController;