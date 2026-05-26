const express = require('express');
const controller = require('../controllers/surveyRoundController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  startSurveyRoundSchema,
  closeSurveyRoundSchema,
} = require('../validators/surveyRoundValidators');

const router = express.Router();

router.use(authMiddleware);

router.get('/active', controller.active);
router.get('/', controller.list);
router.post('/', validate(startSurveyRoundSchema), controller.start);
router.get('/:id', controller.getById);
router.patch('/:id/close', validate(closeSurveyRoundSchema), controller.close);

module.exports = router;
