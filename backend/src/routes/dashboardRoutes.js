const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.use(requireRoles('admin', 'coordinador'));

router.get('/weekly', dashboardController.weekly);
router.get('/summary', dashboardController.summary);

module.exports = router;
