const express = require('express');
const presupuestoController = require('../controllers/presupuestoController');
const verifyJWT = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', verifyJWT, presupuestoController.getPresupuestos);
router.post('/', verifyJWT, presupuestoController.createPresupuesto);
router.delete('/:id', verifyJWT, presupuestoController.deletePresupuesto);
router.put('/:id', verifyJWT, presupuestoController.updatePresupuesto); // New route for updating


module.exports = router;
