const express = require('express');
const blockController = require('../controllers/blockController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { createBlockSchema, updateBlockSchema } = require('../validators/blockValidators');

const router = express.Router();

router.use(authMiddleware);

router.get('/', blockController.list);
router.get('/:id', blockController.getById);

router.use(requireRoles('admin', 'coordinador'));
router.post('/', validate(createBlockSchema), blockController.create);
router.patch('/:id', validate(updateBlockSchema), blockController.update);
router.delete('/:id', blockController.remove);

module.exports = router;
