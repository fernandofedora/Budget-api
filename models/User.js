const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const db = require('../config/db'); // Assuming db configuration is moved to a separate file

const User = {
  create: async (email, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.promise().execute(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );
    return result.insertId;
  },

  findByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  }
};

module.exports = User;
