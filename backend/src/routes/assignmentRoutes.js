const express = require('express');
const assignmentController = require('../controllers/assignmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  createAssignmentSchema,
  updateAssignmentSchema,
} = require('../validators/assignmentValidators');

const router = express.Router();

router.use(authMiddleware);

router.get('/my-blocks', requireRoles('recorridor'), assignmentController.myBlocks);

router.use(requireRoles('admin', 'coordinador'));
router.get('/', assignmentController.list);
router.post('/', validate(createAssignmentSchema), assignmentController.create);
router.patch('/:id', validate(updateAssignmentSchema), assignmentController.update);
router.delete('/:id', assignmentController.remove);

module.exports = router;
