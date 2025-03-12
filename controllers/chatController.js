const conn = require("../services/db");

// Send a text message
exports.sendMessage = (req, res) => {
    const { receiver_id, message } = req.body;
    const sender_id = req.userId;

    const query = `
    INSERT INTO messages (sender_id, receiver_id, message)
    VALUES (?, ?, ?);
  `;

    conn.query(query, [sender_id, receiver_id, message], (err, results) => {
        if (err) {
            return res.status(500).json({ msg: "Database error", error: err });
        }
        res.status(200).json({ msg: "Message sent successfully", messageId: results.insertId });
    });
};

// Send a photo
exports.sendPhoto = (req, res) => {
    const { receiver_id, photo_url } = req.body;
    const sender_id = req.userId;

    const messageQuery = `
    INSERT INTO messages (sender_id, receiver_id, message)
    VALUES (?, ?, ?);
  `;

    conn.query(messageQuery, [sender_id, receiver_id, ''], (err, results) => {
        if (err) {
            return res.status(500).json({ msg: "Database error", error: err });
        }

        const messageId = results.insertId;

        const photoQuery = `
      INSERT INTO message_photos (message_id, photo_url)
      VALUES (?, ?);
    `;

        conn.query(photoQuery, [messageId, photo_url], (err) => {
            if (err) {
                return res.status(500).json({ msg: "Database error", error: err });
            }
            res.status(200).json({ msg: "Photo sent successfully", messageId });
        });
    });
};

// Fetch chat history
exports.getChatHistory = (req, res) => {
    const { other_user_id } = req.params;
    const user_id = req.userId;

    const query = `
    SELECT 
      m.id AS message_id,
      m.sender_id,
      m.receiver_id,
      m.message,
      m.created_at AS message_created_at,
      mp.photo_url,
      mp.created_at AS photo_created_at,
      ma.audio_url,
      ma.created_at AS audio_created_at
    FROM messages m
    LEFT JOIN message_photos mp ON m.id = mp.message_id
    LEFT JOIN message_audios ma ON m.id = ma.message_id
    WHERE (m.sender_id = ? AND m.receiver_id = ?)
       OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.created_at ASC;
  `;

    conn.query(query, [user_id, other_user_id, other_user_id, user_id], (err, results) => {
        if (err) {
            return res.status(500).json({ msg: "Database error", error: err });
        }

        const chatHistory = results.map(row => ({
            message_id: row.message_id,
            sender_id: row.sender_id,
            receiver_id: row.receiver_id,
            message: row.message,
            photo_url: row.photo_url,
            audio_url: row.audio_url,
            created_at: row.message_created_at || row.photo_created_at || row.audio_created_at
        }));

        res.status(200).json({ chatHistory });
    });
};
exports.sendAudio = (req, res) => {
    const { receiver_id, audio_url } = req.body;
    const sender_id = req.userId;

    // Insert a new message into the messages table
    const messageQuery = `
    INSERT INTO messages (sender_id, receiver_id, message)
    VALUES (?, ?, ?);
  `;

    conn.query(messageQuery, [sender_id, receiver_id, ''], (err, results) => {
        if (err) {
            return res.status(500).json({ msg: "Database error", error: err });
        }

        const messageId = results.insertId;

        // Insert the audio file URL into the message_audios table
        const audioQuery = `
      INSERT INTO message_audios (message_id, audio_url)
      VALUES (?, ?);
    `;

        conn.query(audioQuery, [messageId, audio_url], (err) => {
            if (err) {
                return res.status(500).json({ msg: "Database error", error: err });
            }
            res.status(200).json({ msg: "Audio sent successfully", messageId });
        });
    });
};