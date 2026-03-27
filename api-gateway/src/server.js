require('dotenv').config();
const express=require('express');
const cors=require('cors');
const Redis = require('ioredis');
const helmet=require('helmet');
const errorHandler=require('./middleware/errorHandler');
const logger=require('./utils/logger');
const {rateLimit}=require('express-rate-limit');
const {RedisStore}=require('rate-limit-redis');
//important concept of proxy
//proxy is an intermediary server that sits between clients and backend services, forwarding requests and responses. 
// In microservices architecture, API Gateway acts as a proxy, routing client requests to appropriate microservices, 
// handling cross-cutting concerns like authentication, rate limiting, and logging. This allows for better separation of concerns and simplifies client interactions with multiple services.
const proxy = require('express-http-proxy');// Express HTTP Proxy is a middleware for Express.js that allows you to easily create a proxy server.
const { validateToken } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;
const redisClient = new Redis(process.env.REDIS_URL);
app.use(express.json());
app.use(cors());
app.use(helmet());

//rate limiting
const rateLimiter= rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ message: 'Too many requests from this IP, please try again after 15 minutes' });
    },
    store: new RedisStore({// Use Redis for rate limit storage
        sendCommand: (...args) => redisClient.call(...args),// Use Redis client to send commands
    }),
});
app.use(rateLimiter);
app.use((req,res,next)=>{
    logger.info(`${req.method} ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
});

const proxyOptions={
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, '/api'); // Remove the /api/identity prefix before forwarding to the identity service
    },
    proxyErrorHandler: (err, res) => {
        logger.error(`Proxy error: ${err.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
}   

app.use('/v1/auth', proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator:(proxyReqOpts, srcReq) => {
        // Add any custom headers or modify the request options here if needed
        proxyReqOpts.headers['Content-Type'] = 'application/json'; // Set the content type
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Received response from identity service with status code: ${proxyRes.statusCode}`);
        // Modify the response from the identity service if needed before sending it back to the client
        return proxyResData; // Return the original response data without modification
    }
}));// Proxy requests starting with /v1/auth to the identity service 
    
 app.use('/v1/posts',validateToken,proxy(process.env.POST_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator:(proxyReqOpts, srcReq) => {
        // Add any custom headers or modify the request options here if needed
        // `identity-service` signs tokens with `payload = { userId, username }`
        // so the gateway must forward `userId` as `x-user-id` for the post-service.
        const userId = srcReq.user?.userId || srcReq.user?.id; //userId is the user id from the token
        if (userId) {
            proxyReqOpts.headers['x-user-id'] = userId;
        }
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Received response from post service with status code: ${proxyRes.statusCode}`);
        return proxyResData; // Return the original response data without modification
    }
   
}));// Proxy requests starting with /v1/posts to the post service
app.use('/v1/media',validateToken,proxy(process.env.MEDIA_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator:(proxyReqOpts, srcReq) => {
        // Add any custom headers or modify the request options here if needed
        proxyReqOpts.headers = proxyReqOpts.headers || {};
        const userId = srcReq.user?.userId || srcReq.user?.id; //userId is the user id from the token
        if (userId) {
            proxyReqOpts.headers['x-user-id'] = userId;
        }
        // `req.headers` keys are lowercase in Node, and `content-type` may be missing.
        // Only force JSON for non-multipart requests (multipart includes boundary).
        const contentType = srcReq.headers['content-type'];
        if (typeof contentType === 'string' && !contentType.startsWith('multipart/form-data')) {
            proxyReqOpts.headers['content-type'] = 'application/json';
        }
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Received response from media service with status code: ${proxyRes.statusCode}`);
        return proxyResData; // Return the original response data without modification
    },
    parseReqBody:false

}));// Proxy requests starting with /v1/media to the media service
app.use('/v1/search',validateToken,proxy(process.env.SEARCH_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator:(proxyReqOpts, srcReq) => {
        proxyReqOpts.headers['x-user-id'] = srcReq.user?.userId || srcReq.user?.id;
        proxyReqOpts.headers['content-type'] = 'application/json';
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Received response from search service with status code: ${proxyRes.statusCode}`);
        return proxyResData; // Return the original response data without modification
    }
}));// Proxy requests starting with /v1/search to the search service
app.use(errorHandler);
app.listen(PORT,()=>{
    logger.info(`API Gateway is running on port ${PORT}`);
    logger.info(`Proxying requests to identity service at ${process.env.IDENTITY_SERVICE_URL}`);
    logger.info(`Proxying requests to post service at ${process.env.POST_SERVICE_URL}`);
    logger.info(`Proxying requests to media service at ${process.env.MEDIA_SERVICE_URL}`);
    logger.info(`Proxying requests to search service at ${process.env.SEARCH_SERVICE_URL}`);
    logger.info(`Connected to Redis at ${process.env.REDIS_URL}`);
})