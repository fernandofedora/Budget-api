const Gasto = require('../models/Gasto');

const gastoController = {
    createGasto: async (req, res) => {
        const { presupuestoId, descripcion, monto } = req.body;
        try {
            const gasto = await Gasto.create(presupuestoId, descripcion, monto);
            res.status(201).json(gasto);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getGastosByPresupuesto: async (req, res) => {
        const { presupuestoId } = req.query;
        try {
            const gastos = await Gasto.findByPresupuestoId(presupuestoId);
            res.json(gastos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = gastoController;
