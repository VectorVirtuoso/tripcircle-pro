const express = require('express');
const router = express.Router();
const { signupUser, loginUser, getUsers } = require('../controllers/userController');

router.post('/signup', signupUser);
router.post('/login', loginUser);

// Put the GET route back
router.get('/', getUsers); 

module.exports = router;