const Presupuesto = require('../models/Presupuesto');

const presupuestoController = {
  getPresupuestos: async (req, res) => {
    try {
      const presupuestos = await Presupuesto.findByUserId(req.userId);
      res.json(presupuestos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createPresupuesto: async (req, res) => {
    const { nombre, monto } = req.body;
    try {
      const presupuesto = await Presupuesto.create(req.userId, nombre, monto);
      res.status(201).json(presupuesto);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deletePresupuesto: async (req, res) => {
    const { id } = req.params;
    try {
      await Presupuesto.deleteById(id, req.userId);
      res.json({ message: 'Presupuesto eliminado' });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },
  
  updatePresupuesto: async (req, res) => {
    const { id } = req.params;
    const { nombre, monto } = req.body;
    try {
      const presupuesto = await Presupuesto.updateById(id, req.userId, nombre, monto);
      res.json(presupuesto);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
};

module.exports = presupuestoController;
