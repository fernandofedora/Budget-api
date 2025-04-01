const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const authController = {
  register: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
      }
      const userId = await User.create(email, password);
      const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '1h'
      });
      res.status(201).json({ message: 'Usuario registrado', token });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'El usuario ya existe' });
      }
      res.status(500).json({ error: 'Error al crear el usuario' });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      const token = jwt.sign({ id: user.id, email }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '1h'
      });
      res.json({ message: 'Login exitoso', token });
    } catch (error) {
      res.status(500).json({ error: 'Error al iniciar sesión' });
    }
  }
};

module.exports = authController;
