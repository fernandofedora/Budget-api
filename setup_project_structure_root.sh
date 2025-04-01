#!/bin/bash

# Create directories
mkdir -p controllers
mkdir -p models
mkdir -p routes
mkdir -p config

# Create files with basic content

# app.js
cat <<EOL > app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const createTables = require('./config/createTables');
const app = express();

// Configuración de middleware
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Crear tablas al iniciar la aplicación (opcional)
createTables();

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/budgets', budgetRoutes);

// Puerto del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`Servidor listo en http://localhost:\${PORT}\`));
EOL

# controllers/authController.js
cat <<EOL > controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {
  register: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = await User.create(email, hashedPassword);
      const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
      res.status(201).json({ message: 'Usuario registrado', token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al registrar usuario' });
    }
  },
  login: async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Credenciales inválidas' });
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
      res.json({ message: 'Login exitoso', token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error en el login' });
    }
  }
};

module.exports = authController;
EOL

# controllers/budgetController.js
cat <<EOL > controllers/budgetController.js
const Budget = require('../models/Budget');

const budgetController = {
  getBudgets: async (req, res) => {
    try {
      const budgets = await Budget.findByUserId(req.userId);
      res.json(budgets.map(budget => ({
        ...budget,
        monto: parseFloat(budget.monto),
        restante: parseFloat(budget.restante)
      })));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
  createBudget: async (req, res) => {
    try {
      const { nombre, monto } = req.body;
      const budgetId = await Budget.create(req.userId, nombre, monto);
      res.status(201).json({ id: budgetId, nombre, monto });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
  deleteBudget: async (req, res) => {
    try {
      const { id } = req.params;
      const affectedRows = await Budget.delete(id, req.userId);
      if (!affectedRows) return res.status(404).json({ error: 'Presupuesto no encontrado' });
      res.json({ message: 'Presupuesto eliminado' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = budgetController;
EOL

# controllers/expenseController.js
cat <<EOL > controllers/expenseController.js
const Expense = require('../models/Expense');

const expenseController = {
  createExpense: async (req, res) => {
    try {
      const { presupuestoId, descripcion, monto } = req.body;
      const expenseId = await Expense.create(presupuestoId, descripcion, monto);
      res.status(201).json({ id: expenseId, descripcion, monto });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
  getExpenses: async (req, res) => {
    try {
      const { presupuestoId } = req.params;
      const expenses = await Expense.findByBudgetId(req.userId, presupuestoId);
      res.json(expenses);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = expenseController;
EOL

# models/User.js
cat <<EOL > models/User.js
const db = require('../config/dbConfig');

const User = {
  create: async (email, hashedPassword) => {
    const [result] = await db.promise().execute(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );
    return result.insertId;
  },
  findByEmail: async (email) => {
    const [results] = await db.promise().execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return results[0];
  }
};

module.exports = User;
EOL

# models/Budget.js
cat <<EOL > models/Budget.js
const db = require('../config/dbConfig');

const Budget = {
  findByUserId: (userId) => {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM presupuestos WHERE user_id = ?',
        [userId],
        (err, results) => {
          if (err) reject(err);
          resolve(results);
        }
      );
    });
  },
  create: (userId, nombre, monto) => {
    return new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO presupuestos (user_id, nombre, monto, restante) VALUES (?, ?, ?, ?)',
        [userId, nombre, monto, monto],
        (err, result) => {
          if (err) reject(err);
          resolve(result.insertId);
        }
      );
    });
  },
  delete: (id, userId) => {
    return new Promise((resolve, reject) => {
      db.query(
        'DELETE FROM presupuestos WHERE id = ? AND user_id = ?',
        [id, userId],
        (err, result) => {
          if (err) reject(err);
          resolve(result.affectedRows);
        }
      );
    });
  }
};

module.exports = Budget;
EOL

# models/Expense.js
cat <<EOL > models/Expense.js
const db = require('../config/dbConfig');

const Expense = {
  create: async (presupuestoId, descripcion, monto) => {
    const [result] = await db.promise().execute(
      'INSERT INTO gastos (presupuesto_id, descripcion, monto) VALUES (?, ?, ?)',
      [presupuestoId, descripcion, monto]
    );
    return result.insertId;
  },
  findByBudgetId: async (userId, presupuestoId) => {
    const [results] = await db.promise().execute(
      'SELECT g.* FROM gastos g INNER JOIN presupuestos p ON g.presupuesto_id = p.id WHERE p.user_id = ? AND g.presupuesto_id = ?',
      [userId, presupuestoId]
    );
    return results;
  }
};

module.exports = Expense;
EOL

# routes/authRoutes.js
cat <<EOL > routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;
EOL

# routes/budgetRoutes.js
cat <<EOL > routes/budgetRoutes.js
const express = require('express');
const budgetController = require('../controllers/budgetController');
const verifyJWT = require('../middlewares/verifyJWT'); // Middleware para JWT
const router = express.Router();

router.get('/', verifyJWT, budgetController.getBudgets);
router.post('/', verifyJWT, budgetController.createBudget);
router.delete('/:id', verifyJWT, budgetController.deleteBudget);

module.exports = router;
EOL

# routes/expenseRoutes.js
cat <<EOL > routes/expenseRoutes.js
const express = require('express');
const expenseController = require('../controllers/expenseController');
const verifyJWT = require('../middlewares/verifyJWT'); // Middleware para JWT
const router = express.Router();

router.get('/:presupuestoId', verifyJWT, expenseController.getExpenses);
router.post('/', verifyJWT, expenseController.createExpense);

module.exports = router;
EOL

# config/dbConfig.js
cat <<EOL > config/dbConfig.js
const mysql = require('mysql2');

// Configuración de la conexión a MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'presupuestos_db',
  multipleStatements: true,
});

// Conexión a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
    throw err;
  }
  console.log('Conectado a MySQL');
});

module.exports = db;
EOL

# config/createTables.js
cat <<EOL > config/createTables.js
const db = require('./dbConfig');

const createTables = () => {
  const queries = \`
    DROP TABLE IF EXISTS gastos;
    DROP TABLE IF EXISTS presupuestos;
    DROP TABLE IF EXISTS users;
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE presupuestos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      nombre VARCHAR(255) NOT NULL,
      monto DECIMAL(10, 2) NOT NULL,
      restante DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE gastos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      presupuesto_id INT NOT NULL,
      descripcion VARCHAR(255) NOT NULL,
      monto DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE
    );
  \`;
  db.query(queries, (err) => {
    if (err) {
      console.error('Error al crear las tablas:', err.message);
      throw err;
    }
    console.log('Tablas creadas correctamente');
  });
};

module.exports = createTables;
EOL

echo "Project structure created successfully."