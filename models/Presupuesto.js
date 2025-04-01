const db = require('../config/db');

const Presupuesto = {
  create: (userId, nombre, monto) => {
    return new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO presupuestos (user_id, nombre, monto, restante) VALUES (?, ?, ?, ?)',
        [userId, nombre, monto, monto],
        (err, result) => {
          if (err) return reject(err);
          resolve({
            id: result.insertId,
            nombre,
            monto,
            restante: monto
          });
        }
      );
    });
  },

  findByUserId: (userId) => {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM presupuestos WHERE user_id = ?',
        [userId],
        (err, results) => {
          if (err) return reject(err);
          const presupuestos = results.map(p => ({
            ...p,
            monto: parseFloat(p.monto),
            restante: parseFloat(p.restante)
          }));
          resolve(presupuestos);
        }
      );
    });
  },

  deleteById: (id, userId) => {
    return new Promise((resolve, reject) => {
      db.query(
        'DELETE FROM presupuestos WHERE id = ? AND user_id = ?',
        [id, userId],
        (err, result) => {
          if (err) return reject(err);
          if (result.affectedRows === 0) {
            return reject(new Error('Presupuesto no encontrado'));
          }
          resolve();
        }
      );
    });
  },

  updateById: (id, userId, nombre, monto) => {
    return new Promise((resolve, reject) => {
      db.query(
        'UPDATE presupuestos SET nombre = ?, monto = ?, restante = ? WHERE id = ? AND user_id = ?',
        [nombre, monto, monto, id, userId],
        (err, result) => {
          if (err) return reject(err);
          if (result.affectedRows === 0) {
            return reject(new Error('Presupuesto no encontrado o sin permisos para actualizar'));
          }
          resolve({ id, nombre, monto, restante: monto });
        }
      );
    });
  }
};

module.exports = Presupuesto;
