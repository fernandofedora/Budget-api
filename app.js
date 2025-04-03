require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();

// Configuración de middleware
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsear JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'presupuestos_db',
  multipleStatements: true
});

// Conexión a la base de datos
db.connect(err => {
  if (err) throw err;
  console.log('Conectado a MySQL');
  createTables();
});

// Función para crear tablas
const createTables = () => {
  const queries = `
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
    ALTER TABLE gastos
    ADD COLUMN fecha DATE NOT NULL DEFAULT (CURRENT_DATE)
  `;
  db.query(queries, (err) => {
    if (err) throw err;
    console.log('Tablas creadas correctamente');
  });
};

// Middleware para verificar JWT
const verifyJWT = require('./middleware/authMiddleware');

// Rutas
const authRoutes = require('./routes/authRoutes');
const presupuestoRoutes = require('./routes/presupuestoRoutes');
const gastoRoutes = require('./routes/gastoRoutes');

app.use('/api', authRoutes);
app.use('/presupuestos', presupuestoRoutes);
app.use('/gastos', gastoRoutes);

// Ruta para verificar la autenticación
app.get('/api/check-auth', verifyJWT, (req, res) => {
  res.json({ authenticated: true, userId: req.userId });
});

// Ruta para cerrar sesión
app.post('/api/logout', (req, res) => {
  res.json({ message: 'Cierre de sesión exitoso' });
});

// Ruta de ejemplo protegida
app.get('/api/protected', verifyJWT, (req, res) => {
  res.json({ message: 'Ruta protegida', userId: req.userId });
});

// Configuración del puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});
