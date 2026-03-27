
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefereshToken');
const User = require('../models/User');
const logger = require('./logger');
 // referesh token is short lived token say for 5 min so user will have acess to 
//  resources for 5 min and after that user need to login again to get new access token a
// refresh token is long lived token say for 7 days so user can use refresh token to get new access token without login again for 7 days
// why we need refresh token? because access token is short lived token so user need to login again to get new access token after access token expires but with refresh token user can get new access token without login again for 7 days
//"so basically refresh token is used to get new access token without login again for a long time and access token is used to access protected resources for a short time"
const generateTokens = async (user) => {
    try{
        const payload = { userId: user._id, username: user.username };
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }); // Access token valid for 7 days
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });// Refresh token valid for 7 days why is refresh token secret different from access token secret? because if access token is compromised, refresh token can still be used to generate new access tokens without compromising the security of the system. By using a different secret for refresh tokens, we can ensure that even if an attacker gains access to the access token, they cannot use it to generate new tokens without also having access to the refresh token secret.
        const refreshTokenDoc = new RefreshToken({
            user: user._id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });
        await refreshTokenDoc.save();
        return { accessToken, refreshToken };
    } catch (error) {
        logger.error("Error generating tokens: %s", error.message);
        throw new Error("Error generating tokens");
    }
}
module.exports = generateTokens;