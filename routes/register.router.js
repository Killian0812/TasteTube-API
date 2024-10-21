const router = require('express').Router();
const registerController = require('../controllers/register.controller');

router.post('/', registerController.register);
router.post('/set_role', registerController.setAccountType);

module.exports = router;
