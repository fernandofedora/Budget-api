const express = require('express');
const gastoController = require('../controllers/gastoController');
// Ensure this path is correct

const verifyJWT = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', verifyJWT, gastoController.createGasto);
//router.get('/', verifyJWT, gastoController.getGastos);
router.get('/', verifyJWT, gastoController.getGastosByPresupuesto); // New route for fetching expenses


module.exports = router;
