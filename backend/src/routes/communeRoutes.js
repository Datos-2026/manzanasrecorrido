const express = require('express');
const communeController = require('../controllers/communeController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { createCommuneSchema, updateCommuneSchema } = require('../validators/communeValidators');

const router = express.Router();

router.use(authMiddleware);

router.get('/', communeController.list);
router.get('/:id', communeController.getById);

router.use(requireRoles('admin'));
router.post('/', validate(createCommuneSchema), communeController.create);
router.patch('/:id', validate(updateCommuneSchema), communeController.update);
router.delete('/:id', communeController.remove);

module.exports = router;
