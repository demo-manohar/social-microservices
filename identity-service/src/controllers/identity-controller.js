//user registration 

const User = require("../models/User");
const logger = require("../utils/logger");
const { validateUserRegistration, validateUserLogin } = require("../utils/validations");
const generateTokens = require("../utils/generateToken");
const RefreshToken = require("../models/RefereshToken");
const userRegistration= async(req,res)=>{
    logger.info("Attempting to register a new user");

    try{
        const {error}= validateUserRegistration(req.body);
        if(error){
            logger.warn("User registration validation failed: %s", error.details[0].message);
            return res.status(400).json({message:error.details[0].message});
        }
        const {username,email,password}= req.body;
        const existingUser=await User.findOne({$or:[{username},{email}]}); 
        if(existingUser){
            logger.warn("User registration failed: Username or email already exists");
            return res.status(400).json({message:"Username or email already exists"});
        }
        const newUser= new User({username,email,password});
        await newUser.save(); 
        logger.info("User registered successfully: %s", username);
        const { accessToken, refreshToken } = await generateTokens(newUser);
        res.status(201).json({ success:true, message:"User registered successfully", accessToken, refreshToken });

    } catch (error) {
        logger.error("User registration failed: %s", error.message);
        res.status(500).json({message:"Internal server error"});
    }
}

const userLogin= async(req,res)=>{
logger.info("Attempting to log in user");

try{
    const {error}= validateUserLogin(req.body);
    if(error){
        logger.warn("User login validation failed: %s", error.details[0].message);
        return res.status(400).json({message:error.details[0].message});
    }
    const {username,password}= req.body;
    const user= await User.findOne({username});
    if(!user){
        logger.warn("User login failed: Invalid username");
        return res.status(400).json({message:"Invalid username or password"});
    }   
    const isMatch= await user.comparePassword(password);
    if(!isMatch){
        logger.warn("User login failed: Invalid password");
        return res.status(400).json({message:"Invalid username or password"});
    }
    logger.info("User logged in successfully: %s", username);
    const { accessToken, refreshToken } = await generateTokens(user);
    res.status(200).json({ success:true, message:"User logged in successfully", accessToken, refreshToken });
} catch (error) {
    logger.error("User login failed: %s", error.message);
    res.status(500).json({message:"Internal server error"});

}

}

const logout= async(req,res)=>{
    logger.info("Attempting to log out user");
    try{
        const { refreshToken } = req.body;
        if(!refreshToken){
            logger.warn("User logout failed: Refresh token is required");
            return res.status(400).json({message:"Refresh token is required"});
        }   
        await RefreshToken.findOneAndDelete({ token: refreshToken });
        logger.info("User logged out successfully");
        res.status(200).json({ success:true, message:"User logged out successfully" });
    } catch (error) {
        logger.error("User logout failed: %s", error.message);
        res.status(500).json({message:"Internal server error"});
    }
}


module.exports={userRegistration, userLogin, logout};