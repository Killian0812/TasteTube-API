const router = require('express').Router();
const registerController = require('../controllers/register.controller');

router.post('/', registerController.handleRegister);
router.post('/set_role', registerController.handleSetAccountType);

module.exports = router;
