const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { createUserSchema, updateUserSchema } = require('../validators/userValidators');

const router = express.Router();

router.use(authMiddleware);
router.use(requireRoles('admin', 'coordinador'));

router.get('/', userController.list);
router.get('/:id', userController.getById);
router.post('/', validate(createUserSchema), userController.create);
router.patch('/:id', validate(updateUserSchema), userController.update);
router.delete('/:id', userController.remove);

module.exports = router;
