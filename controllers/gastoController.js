const Gasto = require('../models/Gasto');

const gastoController = {
    createGasto: async (req, res) => {
        const { presupuestoId, descripcion, monto, fecha } = req.body;
        try {
            const gasto = await Gasto.create(presupuestoId, descripcion, monto, fecha);
            res.status(201).json(gasto);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getGastosByPresupuesto: async (req, res) => {
        const { presupuestoId } = req.query;
        try {
            const gastos = await Gasto.findByPresupuestoId(presupuestoId);
            console.log(gastos);
            res.json(gastos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    updateGasto: async (req, res) => {
        const { id } = req.params;
        const { descripcion, monto, fecha, presupuestoId } = req.body;
        try {
            const gasto = await Gasto.updateById(id, presupuestoId, descripcion, monto, fecha);
            res.json(gasto);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
};

module.exports = gastoController;
