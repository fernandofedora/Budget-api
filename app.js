require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const FileStore = require('session-file-store')(session);

// Configuración de middleware
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'] //esta shit puede que salve el codigo
}));

// Agregar middleware para parsear JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  store: new FileStore({ path: './sessions' }), // Guarda sesiones en el disco
  cookie: {
      secure: true,
      httpOnly: false,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax'
  }
}));

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
    `;
    db.query(queries, (err) => {
        if (err) throw err;
        console.log('Tablas creadas correctamente');
    });
};

// Middleware de autenticación
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'No autenticado' });
    }
    next();
};

// ================== RUTAS DE AUTENTICACIÓN ================== //
app.post('/api/register', async (req, res) => {
  console.log('req.body:', req.body);
    try {
        const { email, password } = req.body;
        // Validar campos
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña requeridos' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Usar promesas nativas de mysql2
        const [result] = await db.promise().execute(
            'INSERT INTO users (email, password) VALUES (?, ?)',
            [email, hashedPassword]
        );
        req.session.userId = result.insertId;
        res.status(201).json({ message: 'Usuario registrado' });
    } catch (error) {
        console.error('Error en registro:', error); // ← Agregar log
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }
        res.status(500).json({ error: 'Error al crear el usuario' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    db.query(
        'SELECT * FROM users WHERE email = ?',
        [email],
        async (err, results) => {
            if (err || !results[0]) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const validPassword = await bcrypt.compare(password, results[0].password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            req.session.userId = results[0].id;
            console.log('Sesión creada en login:', req.sessionID, req.session.userId);
            res.json({ message: 'Login exitoso' });
        }
    );
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al destruir la sesión:', err);
            return res.status(500).json({ error: 'Error interno al cerrar sesión' });
        }

        // Limpiar la cookie de sesión explícitamente
        res.clearCookie('connect.sid', {
            path: '/',
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            // secure: process.env.NODE_ENV === 'production'
        });
        res.json({ message: 'Sesión cerrada exitosamente' });
    });
});

app.get('/api/check-auth', (req, res) => {
  console.log('Verificando autenticación:', req.session.userId);
    req.session.userId ? res.json({ authenticated: true }) : res.status(401).end();
});

// ================== RUTAS DE PRESUPUESTOS ================== //
app.get('/presupuestos', requireAuth, (req, res) => {
    db.query(
        'SELECT * FROM presupuestos WHERE user_id = ?',
        [req.session.userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            const presupuestos = results.map(p => ({
                ...p,
                monto: parseFloat(p.monto),
                restante: parseFloat(p.restante)
            }));
            res.json(presupuestos);
        }
    );
});

app.post('/presupuestos', requireAuth, (req, res) => {
    const { nombre, monto } = req.body;
    const userId = req.session.userId;
    db.query(
        'INSERT INTO presupuestos (user_id, nombre, monto, restante) VALUES (?, ?, ?, ?)',
        [userId, nombre, monto, monto],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                id: result.insertId,
                nombre,
                monto,
                restante: monto
            });
        }
    );
});

app.delete('/presupuestos/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const userId = req.session.userId;
    db.query(
        'DELETE FROM presupuestos WHERE id = ? AND user_id = ?',
        [id, userId],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Presupuesto no encontrado' });
            }
            res.json({ message: 'Presupuesto eliminado' });
        }
    );
});

// ================== RUTAS DE GASTOS ================== //
app.post('/gastos', requireAuth, (req, res) => {
    const { presupuestoId, descripcion, monto } = req.body;
    const userId = req.session.userId;
    db.query(
        `SELECT p.id FROM presupuestos p
        WHERE p.id = ? AND p.user_id = ?`,
        [presupuestoId, userId],
        (err, results) => {
            if (err || results.length === 0) {
                return res.status(404).json({ error: 'Presupuesto no encontrado' });
            }

            db.query(
                'INSERT INTO gastos (presupuesto_id, descripcion, monto) VALUES (?, ?, ?)',
                [presupuestoId, descripcion, monto],
                (err, result) => {
                    if (err) return res.status(500).json({ error: err.message });
                    db.query(
                        'UPDATE presupuestos SET restante = restante - ? WHERE id = ?',
                        [monto, presupuestoId],
                        (err) => {
                            if (err) return res.status(500).json({ error: err.message });
                            res.status(201).json({
                                id: result.insertId,
                                presupuestoId,
                                descripcion,
                                monto
                            });
                        }
                    );
                }
            );
        }
    );
});

app.get('/gastos', requireAuth, (req, res) => {
    const { presupuestoId } = req.query;
    const userId = req.session.userId;
    db.query(
        `SELECT g.* FROM gastos g
        INNER JOIN presupuestos p ON g.presupuesto_id = p.id
        WHERE p.user_id = ? AND g.presupuesto_id = ?`,
        [userId, presupuestoId],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
});

// Configuración del puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor listo en http://localhost:${PORT}`);
});
