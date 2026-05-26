const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const communeRoutes = require('./communeRoutes');
const blockRoutes = require('./blockRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const visitRoutes = require('./visitRoutes');
const surveyRoundRoutes = require('./surveyRoundRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/communes', communeRoutes);
router.use('/blocks', blockRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/visits', visitRoutes);
router.use('/survey-rounds', surveyRoundRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
