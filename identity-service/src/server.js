const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const identityRoutes = require('./routes/identity-service');
const {RateLimiterRedis} = require('rate-limiter-flexible');
const {rateLimit} = require('express-rate-limit');
const Redis = require('ioredis');
const {RedisStore}=require('rate-limit-redis')
const routes = require('./routes/identity-service');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json());
//connect to MongoDB
mongoose.connect(process.env.MONGODB_URL).then(() => {
    logger.info('Connected to MongoDB');
    console.log('Connected to MongoDB');
}).catch((err) => {
    logger.error('Failed to connect to MongoDB', err);
    console.error('Failed to connect to MongoDB', err);
}); 

const redisClient = new Redis(process.env.REDIS_URL);
// DDos protection using rate limiter
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10, // Number of points
    duration: 1, // Per second(s)
});

//Ip based rate limiting for sensitive endpoints

const sensitiveEndpointsLimiter =  rateLimit({
   windowMs: 15* 60 * 1000, // 15 minute
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ message: 'Too many requests from this IP, please try again after 15 minutes' });
        
    },
    //store is used to store the rate limit data, in this case we are using Redis to store the data, which allows us to share the rate limit data across multiple instances of the application, making it more effective in a distributed environment.
    store: new RedisStore({// Use Redis for rate limit storage
        sendCommand: (...args) => redisClient.call(...args),// Use Redis client to send commands
    }),

});

 
app.use((req, res, next) => {
    rateLimiter.consume(req.ip) // Consume 1 point per request from IP
        .then(() => {
            next();// Allow the request to proceed if within limits
        })
        .catch(() => {
            res.status(429).json({ message: 'Too many requests' });// Block the request if rate limit is exceeded
        });
});

app.use(cors());
app.use(helmet());
app.use('/api/auth/register', sensitiveEndpointsLimiter,routes);
app.use('/api/auth', routes);
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Identity Service running on port ${PORT}`);
    console.log(`Identity Service running on port ${PORT}`);
});




