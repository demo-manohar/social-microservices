const express=require('express');
const router=express.Router();
const {searchPosts}=require('../controllers/search-controller');
const {authenticateRequest}=require('../middleware/authMiddleware');

router.get('/posts',authenticateRequest,searchPosts);

module.exports=router;