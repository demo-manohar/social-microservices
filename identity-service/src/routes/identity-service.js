const express=require('express');
const router= express.Router();
const {userRegistration, userLogin, logout}= require('../controllers/identity-controller');

router.post('/register', userRegistration);
router.post('/login', userLogin);
router.post('/logout', logout); 

module.exports=router;