require('dotenv').config(); // Cargar variables de entorno

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Configuración de MySQL desde .env
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'presupuestos_db',
    multipleStatements: true
});

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(cors());

// Conexión a MySQL
db.connect(err => {
    if (err) throw err;
    console.log('Conectado a MySQL');
});

// Función para crear tablas con eliminación en cascada
const createTables = () => {
    // Primero eliminamos las tablas si existen
    const dropTables = `
        DROP TABLE IF EXISTS gastos;
        DROP TABLE IF EXISTS presupuestos;
    `;

    db.query(dropTables, (err) => {
        if (err) throw err;
        console.log('Tablas antiguas eliminadas');

        // Crear nueva estructura con CASCADE
        const presupuestoTable = `
            CREATE TABLE presupuestos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                monto DECIMAL(10, 2) NOT NULL,
                restante DECIMAL(10, 2) NOT NULL
            )`;
        
        const gastosTable = `
            CREATE TABLE gastos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                presupuesto_id INT NOT NULL,
                descripcion VARCHAR(255) NOT NULL,
                monto DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (presupuesto_id) 
                REFERENCES presupuestos(id) 
                ON DELETE CASCADE
            )`;

        db.query(presupuestoTable, (err) => {
            if (err) throw err;
            console.log('Tabla presupuestos creada');
        });

        db.query(gastosTable, (err) => {
            if (err) throw err;
            console.log('Tabla gastos creada con ON DELETE CASCADE');
        });
    });
};

// Ejecutar creación de tablas
createTables();

// ================== RUTAS DE LA API ================== //
// Obtener todos los presupuestos
app.get('/presupuestos', (req, res) => {
    db.query('SELECT * FROM presupuestos', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Convertir monto y restante a números
        const presupuestos = results.map(p => ({
            ...p,
            monto: parseFloat(p.monto),
            restante: parseFloat(p.restante)
        }));
        
        res.json(presupuestos);
    });
});

// Crear presupuesto
app.post('/presupuestos', (req, res) => {
    const { nombre, monto } = req.body;
    db.query(
        'INSERT INTO presupuestos (nombre, monto, restante) VALUES (?, ?, ?)',
        [nombre, monto, monto],
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

// Eliminar presupuesto
app.delete('/presupuestos/:id', (req, res) => {
    const { id } = req.params;

    // Eliminar presupuesto
    db.query('DELETE FROM presupuestos WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // Verificar si la tabla está vacía
        db.query('SELECT COUNT(*) AS count FROM presupuestos', (err, results) => {
            if (err) return res.status(500).json({ error: err.message });

            if (results[0].count === 0) {
                // Si la tabla está vacía, reiniciar AUTO_INCREMENT
                db.query('ALTER TABLE presupuestos AUTO_INCREMENT = 1', (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    console.log('AUTO_INCREMENT reiniciado');
                });
            }
        });

        res.json({ message: 'Presupuesto eliminado' });
    });
});

// Agregar gasto
app.post('/gastos', (req, res) => {
    const { presupuestoId, descripcion, monto } = req.body;
    
    db.query('SELECT restante FROM presupuestos WHERE id = ?', [presupuestoId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results[0].restante < monto) return res.status(400).json({ error: 'Fondos insuficientes' });

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
    });
});

// Obtener gastos de un presupuesto
app.get('/gastos', (req, res) => {
    const { presupuestoId } = req.query;
    db.query(
        'SELECT * FROM gastos WHERE presupuesto_id = ?',
        [presupuestoId],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
});

// Archivos estáticos (al final)
app.use(express.static('../ui'));

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor listo en http://localhost:${PORT}`);
});