const moment = require('moment-timezone');
const NodeGeocoder = require('node-geocoder');
const tzLookup = require('tz-lookup');

const astroData = {
  rashiElements: {
    Aries: "Fire", Taurus: "Earth", Gemini: "Air", Cancer: "Water",
    Leo: "Fire", Virgo: "Earth", Libra: "Air", Scorpio: "Water",
    Sagittarius: "Fire", Capricorn: "Earth", Aquarius: "Air", Pisces: "Water",
  },

  rashiFriendship: {
    Aries: ["Leo", "Sagittarius", "Gemini", "Aquarius"],
    Taurus: ["Virgo", "Capricorn", "Cancer", "Pisces"],
    Gemini: ["Libra", "Aquarius", "Aries", "Leo"],
    Cancer: ["Scorpio", "Pisces", "Taurus", "Virgo"],
    Leo: ["Aries", "Sagittarius", "Gemini", "Libra"],
    Virgo: ["Capricorn", "Taurus", "Cancer"],
    Libra: ["Gemini", "Aquarius", "Leo", "Sagittarius"],
    Scorpio: ["Cancer", "Pisces", "Virgo", "Capricorn"],
    Sagittarius: ["Aries", "Leo", "Libra", "Aquarius"],
    Capricorn: ["Taurus", "Virgo", "Scorpio", "Pisces"],
    Aquarius: ["Gemini", "Libra", "Aries", "Sagittarius"],
    Pisces: ["Cancer", "Scorpio", "Taurus", "Capricorn"],
  },

  nakshatraGana: {
    Ashwini: "Deva", Bharani: "Manushya", Krittika: "Rakshasa",
    Rohini: "Manushya", Mrigashira: "Deva", Ardra: "Manushya",
    Punarvasu: "Deva", Pushya: "Deva", Ashlesha: "Rakshasa",
    Magha: "Rakshasa", PurvaPhalguni: "Manushya", UttaraPhalguni: "Manushya",
    Hasta: "Deva", Chitra: "Rakshasa", Swati: "Deva",
    Vishakha: "Rakshasa", Anuradha: "Deva", Jyeshtha: "Rakshasa",
    Mula: "Rakshasa", PurvaAshadha: "Manushya", UttaraAshadha: "Manushya",
    Shravana: "Deva", Dhanishta: "Rakshasa", Shatabhisha: "Rakshasa",
    PurvaBhadrapada: "Manushya", UttaraBhadrapada: "Manushya", Revati: "Deva",
  },

  nakshatraNadi: {
    Ashwini: "Adi", Bharani: "Adi", Krittika: "Adi",
    Rohini: "Madhya", Mrigashira: "Madhya", Ardra: "Madhya",
    Punarvasu: "Adi", Pushya: "Adi", Ashlesha: "Adi",
    Magha: "Madhya", PurvaPhalguni: "Madhya", UttaraPhalguni: "Madhya",
    Hasta: "Antya", Chitra: "Antya", Swati: "Antya",
    Vishakha: "Adi", Anuradha: "Adi", Jyeshtha: "Adi",
    Mula: "Madhya", PurvaAshadha: "Madhya", UttaraAshadha: "Madhya",
    Shravana: "Antya", Dhanishta: "Antya", Shatabhisha: "Antya",
    PurvaBhadrapada: "Adi", UttaraBhadrapada: "Adi", Revati: "Adi",
  },

  nakshatraYoni: {
    Ashwini: "Horse", Bharani: "Elephant", Krittika: "Sheep",
    Rohini: "Serpent", Mrigashira: "Serpent", Ardra: "Dog",
    Punarvasu: "Cat", Pushya: "Sheep", Ashlesha: "Cat",
    Magha: "Rat", PurvaPhalguni: "Rat", UttaraPhalguni: "Cow",
    Hasta: "Buffalo", Chitra: "Tiger", Swati: "Buffalo",
    Vishakha: "Tiger", Anuradha: "Deer", Jyeshtha: "Deer",
    Mula: "Dog", PurvaAshadha: "Monkey", UttaraAshadha: "Mongoose",
    Shravana: "Monkey", Dhanishta: "Lion", Shatabhisha: "Horse",
    PurvaBhadrapada: "Lion", UttaraBhadrapada: "Cow", Revati: "Elephant",
  },

  yoniCompatibility: {
    Horse: ["Horse", "Elephant"], Elephant: ["Horse", "Elephant", "Lion"],
    Sheep: ["Sheep", "Monkey"], Serpent: ["Serpent", "Monkey"],
    Dog: ["Dog", "Deer"], Cat: ["Cat", "Rat"], Rat: ["Cat", "Rat"],
    Cow: ["Cow", "Buffalo"], Buffalo: ["Buffalo", "Cow"],
    Tiger: ["Tiger", "Lion"], Deer: ["Deer", "Dog"],
    Monkey: ["Monkey", "Serpent"], Mongoose: ["Mongoose"],
    Lion: ["Lion", "Tiger"], 
  },

  varnaCompatibility: {
    Brahmin: ["Brahmin", "Kshatriya", "Vaishya"],
    Kshatriya: ["Kshatriya", "Vaishya", "Shudra"],
    Vaishya: ["Vaishya", "Shudra"],
    Shudra: ["Shudra"]
  },

  vashyaCompatibility: {
    Human: ["Human", "Animal", "Water"],
    Animal: ["Animal", "Human"],
    Water: ["Water", "Human"],
    Bird: ["Bird", "Animal"],
    Reptile: ["Reptile", "Animal"]
  },

  taraCompatibility: {
    favorable: [1, 3, 5, 7],
    neutral: [2, 4, 6, 8],
    unfavorable: [9]
  },

  planetaryFriendships: {
    Sun: ["Moon", "Mars", "Jupiter"],
    Moon: ["Sun", "Mercury"],
    Mars: ["Sun", "Moon", "Jupiter"],
    Mercury: ["Sun", "Venus"],
    Jupiter: ["Sun", "Moon", "Mars"],
    Venus: ["Mercury", "Saturn"],
    Saturn: ["Mercury", "Venus"],
    Rahu: ["Saturn", "Mercury"],
    Ketu: ["Mars", "Jupiter"]
  },

  planetaryEnmities: {
    Sun: ["Saturn", "Rahu", "Ketu"],
    Moon: ["Rahu", "Ketu"],
    Mars: ["Mercury", "Venus", "Saturn"],
    Mercury: ["Moon", "Venus"],
    Jupiter: ["Mercury", "Venus"],
    Venus: ["Sun", "Moon"],
    Saturn: ["Sun", "Moon", "Mars"],
    Rahu: ["Sun", "Moon", "Mars"],
    Ketu: ["Sun", "Moon", "Venus"]
  },

  planetaryLords: {
    Aries: "Mars",
    Taurus: "Venus", 
    Gemini: "Mercury",
    Cancer: "Moon",
    Leo: "Sun",
    Virgo: "Mercury",
    Libra: "Venus",
    Scorpio: "Mars",
    Sagittarius: "Jupiter",
    Capricorn: "Saturn",
    Aquarius: "Saturn",
    Pisces: "Jupiter"
  }
};

// Configure geocoder (using OpenStreetMap so no API key needed)
const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
  httpAdapter: 'https',
  fetchOptions: {
    headers: {
      'User-Agent': 'FutureSoulmateApp/1.0 (tarun.xelogic@gmail.com)'
    }
  }
});

async function getLocationInfo(cityName, stateCode = '') {
  const cityKey = cityName.toLowerCase().trim();

  let timezone = null;
  let coordinates = null;

  // 3. If not found locally, fetch coordinates online
  if (!coordinates) {
    try {
      const geoRes = await geocoder.geocode(`${cityName}, ${stateCode}`);
      if (geoRes.length > 0) {
        coordinates = {
          lat: geoRes[0].latitude,
          lng: geoRes[0].longitude
        };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      coordinates = { lat: 40.7128, lng: -74.0060 }; // fallback: NYC
    }
  }

  // 4. If we have coordinates, determine timezone dynamically
  if (coordinates && coordinates.lat && coordinates.lng) {
    try {
      timezone = tzLookup(coordinates.lat, coordinates.lng);
    } catch (error) {
      console.warn('Timezone lookup failed, using fallback.');
      timezone = timezone || 'America/New_York';
    }
  }

  return {
    lat: coordinates.lat,
    lng: coordinates.lng,
    timezone,
    city: cityName,
    state: stateCode
  };
}

// ✅ Calculate Moon Sign based on date (simplified calculation)
function calculateMoonSign(birthDate) {
  const date = moment(birthDate);
  const dayOfYear = date.dayOfYear();
  
  // Approximate moon sign based on day of year (moon changes signs every 2.5 days)
  const moonSigns = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
                    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  
  const signIndex = Math.floor((dayOfYear % 30) / 2.5) % 12;
  return moonSigns[signIndex];
}

// ✅ Calculate Nakshatra based on date (simplified)
function calculateNakshatra(birthDate) {
  const date = moment(birthDate);
  const dayOfYear = date.dayOfYear();
  
  const nakshatras = Object.keys(astroData.nakshatraGana);
  const nakshatraIndex = Math.floor((dayOfYear % 27) / 1) % 27; // 27 nakshatras
  
  return nakshatras[nakshatraIndex];
}

// ✅ Calculate birth chart from city name and date
function calculateBirthChartFromCity(birthDate, birthTime, cityName, stateCode = '') {
  try {
    const location = getLocationInfo(cityName, stateCode);
    const birthMoment = moment.tz(`${birthDate} ${birthTime}`, location.timezone);
    
    const moonSign = calculateMoonSign(birthDate);
    const nakshatra = calculateNakshatra(birthDate);
    const pada = (birthMoment.date() % 4) + 1; // Simple pada calculation
    
    return {
      moonSign: moonSign,
      moonNakshatra: nakshatra,
      moonNakshatraPada: pada,
      ascendant: calculateMoonSign(birthDate), // Simplified
      planetaryPositions: {
        moon: { sign: moonSign },
        sun: { sign: getSunSign(birthDate) }
      },
      location: location,
      birthMoment: birthMoment
    };
  } catch (error) {
    console.error('Error calculating birth chart:', error);
    return null;
  }
}

// ✅ Get Sun Sign (Zodiac sign)
function getSunSign(birthDate) {
  const date = moment(birthDate);
  const day = date.date();
  const month = date.month() + 1; // 0-indexed to 1-indexed
  
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  return "Pisces";
}

// ✅ Traditional Koota Calculations (same as before)
function calculateVarna(moonSignA, moonSignB) {
  const varnaGroups = {
    Brahmin: ["Cancer", "Scorpio", "Pisces"],
    Kshatriya: ["Aries", "Leo", "Sagittarius"],
    Vaishya: ["Taurus", "Virgo", "Capricorn"],
    Shudra: ["Gemini", "Libra", "Aquarius"]
  };

  let varnaA = "Shudra";
  let varnaB = "Shudra";

  Object.keys(varnaGroups).forEach(varna => {
    if (varnaGroups[varna].includes(moonSignA)) varnaA = varna;
    if (varnaGroups[varna].includes(moonSignB)) varnaB = varna;
  });

  if (varnaA === varnaB) return 1;
  if (astroData.varnaCompatibility[varnaA]?.includes(varnaB)) return 0.5;
  return 0;
}

function calculateVashya(moonSignA, moonSignB) {
  const vashyaGroups = {
    Human: ["Gemini", "Virgo", "Libra", "Aquarius", "Capricorn"],
    Animal: ["Aries", "Taurus", "Leo", "Sagittarius"],
    Water: ["Cancer", "Scorpio", "Pisces"]
  };

  let vashyaA = "Human";
  let vashyaB = "Human";

  Object.keys(vashyaGroups).forEach(group => {
    if (vashyaGroups[group].includes(moonSignA)) vashyaA = group;
    if (vashyaGroups[group].includes(moonSignB)) vashyaB = group;
  });

  if (vashyaA === vashyaB) return 2;
  if (astroData.vashyaCompatibility[vashyaA]?.includes(vashyaB)) return 1;
  return 0;
}

function calculateTara(nakshatraA, nakshatraB) {
  const nakshatras = Object.keys(astroData.nakshatraGana);
  const indexA = nakshatras.indexOf(nakshatraA);
  const indexB = nakshatras.indexOf(nakshatraB);
  
  if (indexA === -1 || indexB === -1) return 0;
  
  const difference = (indexB - indexA + 27) % 27;
  const taraNumber = (difference % 9) + 1;
  
  if (astroData.taraCompatibility.favorable.includes(taraNumber)) return 3;
  if (astroData.taraCompatibility.neutral.includes(taraNumber)) return 1.5;
  return 0;
}

function calculateYoniCompatibility(nakshatraA, nakshatraB) {
  const yoniA = astroData.nakshatraYoni[nakshatraA];
  const yoniB = astroData.nakshatraYoni[nakshatraB];
  const loveMatches = astroData.yoniCompatibility[yoniA] || [];
  
  if (yoniA === yoniB) return 4;
  if (loveMatches.includes(yoniB)) return 2;
  return 0;
}

function calculateGrahaMaitri(moonSignA, moonSignB) {
  const moonLordA = astroData.planetaryLords[moonSignA];
  const moonLordB = astroData.planetaryLords[moonSignB];
  const friendsA = astroData.planetaryFriendships[moonLordA] || [];
  const enemiesA = astroData.planetaryEnmities[moonLordA] || [];

  if (moonLordA === moonLordB) return 5;
  if (friendsA.includes(moonLordB)) return 4;
  if (!enemiesA.includes(moonLordB)) return 3;
  return 1;
}

function calculateGanaCompatibility(nakshatraA, nakshatraB) {
  const ganaA = astroData.nakshatraGana[nakshatraA];
  const ganaB = astroData.nakshatraGana[nakshatraB];
  
  if (ganaA === ganaB) return 6;
  if ((ganaA === "Deva" && ganaB === "Manushya") || (ganaA === "Manushya" && ganaB === "Deva")) return 3;
  return 0;
}

function calculateBhakoot(moonSignA, moonSignB) {
  const compatiblePairs = {
    Aries: ["Taurus", "Gemini", "Leo", "Sagittarius", "Aquarius"],
    Taurus: ["Aries", "Cancer", "Virgo", "Capricorn", "Pisces"],
    Gemini: ["Aries", "Leo", "Libra", "Aquarius"],
    Cancer: ["Taurus", "Virgo", "Scorpio", "Pisces"],
    Leo: ["Aries", "Gemini", "Libra", "Sagittarius"],
    Virgo: ["Taurus", "Cancer", "Scorpio", "Capricorn"],
    Libra: ["Gemini", "Leo", "Sagittarius", "Aquarius"],
    Scorpio: ["Cancer", "Virgo", "Capricorn", "Pisces"],
    Sagittarius: ["Aries", "Leo", "Libra", "Aquarius"],
    Capricorn: ["Taurus", "Virgo", "Scorpio", "Pisces"],
    Aquarius: ["Aries", "Gemini", "Libra", "Sagittarius"],
    Pisces: ["Taurus", "Cancer", "Scorpio", "Capricorn"]
  };

  if (moonSignA === moonSignB) return 0;
  const compatibleWithA = compatiblePairs[moonSignA] || [];
  return compatibleWithA.includes(moonSignB) ? 7 : 0;
}

function calculateNadi(nakshatraA, nakshatraB) {
  const nadiA = astroData.nakshatraNadi[nakshatraA];
  const nadiB = astroData.nakshatraNadi[nakshatraB];
  return nadiA !== nadiB ? 8 : 0;
}

function calculateManglikCompatibility(mA, mB) {
  if (mA === "Manglik" && mB === "Manglik") return 5;
  if (mA === "Non-Manglik" && mB === "Non-Manglik") return 5;
  if ((mA === "Manglik" && mB === "Non-Manglik") || (mA === "Non-Manglik" && mB === "Manglik")) return 1;
  if (mA === "Partial Manglik" || mB === "Partial Manglik") return 2;
  if (mA === "Not Sure" || mB === "Not Sure") return 2;
  return 1;
}

// ✅ Modern Compatibility (Your existing function)
function matchCompatibility(userA, userB) {
  let details = {
    Work: { score: 0, max: 1 },
    Influence: { score: 0, max: 2 },
    Destiny: { score: 0, max: 3 },
    Mentality: { score: 0, max: 4 },
    Compatibility: { score: 0, max: 5 },
    Temperament: { score: 0, max: 6 },
    Love: { score: 0, max: 7 },
    Health: { score: 0, max: 8 }
  };

  // Work
  if (userA.nakshatra === userB.nakshatra) details.Work.score = 1;

  // Influence
  const elemA = astroData.rashiElements[userA.rashi];
  const elemB = astroData.rashiElements[userB.rashi];
  if (elemA === elemB) {
    details.Influence.score = 2;
  } else if (
    (elemA === "Fire" && elemB === "Air") || (elemA === "Air" && elemB === "Fire") ||
    (elemA === "Earth" && elemB === "Water") || (elemA === "Water" && elemB === "Earth")
  ) {
    details.Influence.score = 1;
  } else {
    details.Influence.score = 0.5;
  }

  // Destiny
  details.Destiny.score = userA.nakshatra === userB.nakshatra ? 3 : 1;

  // Mentality
  const friendsA = astroData.rashiFriendship[userA.rashi] || [];
  details.Mentality.score = friendsA.includes(userB.rashi) ? 4 : 1;

  // Compatibility (Manglik)
  details.Compatibility.score = calculateManglikCompatibility(userA.manglik, userB.manglik);

  // Temperament
  const ganaA = astroData.nakshatraGana[userA.nakshatra];
  const ganaB = astroData.nakshatraGana[userB.nakshatra];
  if (ganaA === ganaB) {
    details.Temperament.score = 6;
  } else if ((ganaA === "Deva" && ganaB === "Manushya") || (ganaA === "Manushya" && ganaB === "Deva")) {
    details.Temperament.score = 3;
  }

  // Love
  const yoniA = astroData.nakshatraYoni[userA.nakshatra];
  const yoniB = astroData.nakshatraYoni[userB.nakshatra];
  const loveMatches = astroData.yoniCompatibility[yoniA] || [];
  if (yoniA === yoniB) {
    details.Love.score = 7;
  } else if (loveMatches.includes(yoniB)) {
    details.Love.score = 5;
  } else {
    details.Love.score = 2;
  }

  // Health
  const nadiA = astroData.nakshatraNadi[userA.nakshatra];
  const nadiB = astroData.nakshatraNadi[userB.nakshatra];
  details.Health.score = nadiA === nadiB ? 3 : 8;

  return details;
}

// ✅ Complete Horoscope Matching
async function completeHoroscopeMatch(userA, userB) {
  let birthChartA = null;
  let birthChartB = null;

  // Calculate birth charts if full details are provided
  if (userA.birthDate && userA.birthTime && userA.birthCity) {
    birthChartA = calculateBirthChartFromCity(userA.birthDate, userA.birthTime, userA.birthCity, userA.stateCode);
  }

  if (userB.birthDate && userB.birthTime && userB.birthCity) {
    birthChartB = calculateBirthChartFromCity(userB.birthDate, userB.birthTime, userB.birthCity, userB.stateCode);
  }

  // Use calculated or provided data
  const moonSignA = birthChartA?.moonSign || userA.moonSign || userA.rashi;
  const moonSignB = birthChartB?.moonSign || userB.moonSign || userB.rashi;
  
  const nakshatraA = birthChartA?.moonNakshatra || userA.nakshatra;
  const nakshatraB = birthChartB?.moonNakshatra || userB.nakshatra;

  const kootas = {
    Varna: { score: calculateVarna(moonSignA, moonSignB), max: 1, description: "Spiritual Compatibility" },
    Vashya: { score: calculateVashya(moonSignA, moonSignB), max: 2, description: "Mutual Attraction" },
    Tara: { score: calculateTara(nakshatraA, nakshatraB), max: 3, description: "Destiny Compatibility" },
    Yoni: { score: calculateYoniCompatibility(nakshatraA, nakshatraB), max: 4, description: "Physical Compatibility" },
    GrahaMaitri: { score: calculateGrahaMaitri(moonSignA, moonSignB), max: 5, description: "Mental Compatibility" },
    Gana: { score: calculateGanaCompatibility(nakshatraA, nakshatraB), max: 6, description: "Temperament Compatibility" },
    Bhakoot: { score: calculateBhakoot(moonSignA, moonSignB), max: 7, description: "Prosperity Compatibility" },
    Nadi: { score: calculateNadi(nakshatraA, nakshatraB), max: 8, description: "Health Compatibility" }
  };

  return kootas;
}

// ✅ Ultimate Matching Function
async function ultimateHoroscopeMatch(userA, userB) {
  const traditionalScore = await completeHoroscopeMatch(userA, userB);
  const modernScore = matchCompatibility(userA, userB);

  const traditionalTotal = Object.values(traditionalScore).reduce((sum, cat) => sum + cat.score, 0);
  const modernTotal = Object.values(modernScore).reduce((sum, cat) => sum + cat.score, 0);
  
  const overallScore = (traditionalTotal / 36) * 60 + (modernTotal / 36) * 40;

  return {
    traditional: traditionalScore,
    modern: modernScore,
    overall: Math.round(overallScore),
    totalPoints: {
      traditional: `${traditionalTotal}/36`,
      modern: `${modernTotal}/36`
    },
    interpretation: getInterpretation(overallScore),
    isCompatible: overallScore >= 60
  };
}

function getInterpretation(score) {
  if (score >= 75) return "Excellent Compatibility";
  if (score >= 60) return "Good Compatibility";
  if (score >= 45) return "Moderate Compatibility";
  if (score >= 30) return "Challenging Compatibility";
  return "Poor Compatibility";
}

module.exports = {
  astroData,
  ultimateHoroscopeMatch,
  completeHoroscopeMatch,
  getLocationInfo,
  calculateBirthChartFromCity
};