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
                                presupuesto_id: presupuestoId,
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
                'SELECT id, presupuesto_id as presupuestoId, descripcion, CAST(monto AS DECIMAL(10,2)) as monto, fecha FROM gastos WHERE presupuesto_id = ?',
                [presupuestoId],
                (err, results) => {
                    if (err) return reject(err);
                    // Convertir los montos a números
                    const gastos = results.map(gasto => ({
                        ...gasto,
                        monto: parseFloat(gasto.monto)
                    }));
                    resolve(gastos);
                }
            );
        });
    },

    updateById: (id, presupuestoId, descripcion, monto, fecha) => {
        return new Promise((resolve, reject) => {
            db.query(
                'UPDATE gastos SET descripcion = ?, monto = ?, fecha = ? WHERE id = ?',
                [descripcion, monto, fecha, id],
                (err, result) => {
                    if (err) return reject(err);
                    db.query(
                        'UPDATE presupuestos SET restante = monto - ? WHERE id = ?',
                        [monto, presupuestoId],
                        (err) => {
                            if (err) return reject(err);
                            resolve({
                                id,
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
    }
};

module.exports = Gasto;
