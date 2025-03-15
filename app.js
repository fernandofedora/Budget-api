require('dotenv').config();

const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // Importa jsonwebtoken
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
    `;
    db.query(queries, (err) => {
        if (err) throw err;
        console.log('Tablas creadas correctamente');
    });
};

// Middleware para verificar JWT
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No autorizado: Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido' });
        }
        req.userId = decoded.id;
        next();
    });
};

// ================== RUTAS DE AUTENTICACIÓN ================== //

app.post('/api/register', async (req, res) => {
    console.log('req.body:', req.body);
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña requeridos' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.promise().execute(
            'INSERT INTO users (email, password) VALUES (?, ?)',
            [email, hashedPassword]
        );

        // Generar JWT
        const token = jwt.sign({ id: result.insertId, email: email }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '1h' // Expira en 1 hora
        });

        res.status(201).json({ message: 'Usuario registrado', token: token });
    } catch (error) {
        console.error('Error en registro:', error);
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

            // Generar JWT
            const token = jwt.sign({ id: results[0].id, email: email }, process.env.JWT_SECRET || 'secret', {
                expiresIn: '1h' // Expira en 1 hora
            });

            res.json({ message: 'Login exitoso', token: token });
        }
    );
});

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

// ================== RUTAS DE PRESUPUESTOS ================== //

app.get('/presupuestos', verifyJWT, (req, res) => {
    db.query(
        'SELECT * FROM presupuestos WHERE user_id = ?',
        [req.userId],
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

app.post('/presupuestos', verifyJWT, (req, res) => {
    const { nombre, monto } = req.body;
    db.query(
        'INSERT INTO presupuestos (user_id, nombre, monto, restante) VALUES (?, ?, ?, ?)',
        [req.userId, nombre, monto, monto],
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

app.delete('/presupuestos/:id', verifyJWT, (req, res) => {
    const { id } = req.params;
    db.query(
        'DELETE FROM presupuestos WHERE id = ? AND user_id = ?',
        [id, req.userId],
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

app.post('/gastos', verifyJWT, (req, res) => {
    const { presupuestoId, descripcion, monto } = req.body;
    db.query(
        `SELECT p.id FROM presupuestos p
        WHERE p.id = ? AND p.user_id = ?`,
        [presupuestoId, req.userId],
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

app.get('/gastos', verifyJWT, (req, res) => {
    const { presupuestoId } = req.query;
    db.query(
        `SELECT g.* FROM gastos g
        INNER JOIN presupuestos p ON g.presupuesto_id = p.id
        WHERE p.user_id = ? AND g.presupuesto_id = ?`,
        [req.userId, presupuestoId],
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
