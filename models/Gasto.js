const db = require('../config/db');

const Gasto = {
    create: (presupuestoId, descripcion, monto, fecha) => {
        return new Promise((resolve, reject) => {
            db.query(
                'INSERT INTO gastos (presupuesto_id, descripcion, monto, fecha) VALUES (?, ?, ?, ?)',
                [presupuestoId, descripcion, monto, fecha],
                (err, result) => {
                    if (err) return reject(err);
                    db.query(
                        'UPDATE presupuestos SET restante = restante - ? WHERE id = ?',
                        [monto, presupuestoId],
                        (err) => {
                            if (err) return reject(err);
                            resolve({
                                id: result.insertId,
                                presupuestoId,
                                descripcion,
                                monto,
                                fecha
                            });
                        }
                    );
                }
            );
        });
    },

    findByPresupuestoId: (presupuestoId) => {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM gastos WHERE presupuesto_id = ?',
                [presupuestoId],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                }
            );
        });
    }
};

module.exports = Gasto;
