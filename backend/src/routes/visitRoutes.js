const express = require('express');
const visitController = require('../controllers/visitController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { createVisitSchema, updateVisitSchema } = require('../validators/visitValidators');

const router = express.Router();

router.use(authMiddleware);

router.get('/', visitController.list);
router.get('/:id', visitController.getById);
router.post('/', validate(createVisitSchema), visitController.create);
router.patch('/:id', validate(updateVisitSchema), visitController.update);
router.delete('/:id', visitController.remove);

module.exports = router;
