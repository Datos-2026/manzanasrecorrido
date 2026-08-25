const express = require('express');
const geoController = require('../controllers/geoController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.get(
  '/manzanas',
  requireRoles('admin', 'coordinador', 'recorredor'),
  geoController.manzanas
);

module.exports = router;
