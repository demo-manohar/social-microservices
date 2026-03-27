require('dotenv').config();
const express=require('express');
const mongoose=require('mongoose');
const postRoutes=require('./routes/post-routes');
const logger=require('./utils/logger');
const Redis=require('ioredis');
const cors=require('cors');
const helmet=require('helmet');
const errorHandler=require('./middleware/errorHandler');
const { connectToRabbitMQ } = require('./utils/rabbitmq');


const app=express();
const PORT=process.env.PORT || 3002;

mongoose.connect(process.env.MONGODB_URI).then(()=>{
    logger.info('Connected to MongoDB');
}).catch((err)=>{
    logger.error('Error connecting to MongoDB', err);
});

const redisClient=new Redis(process.env.REDIS_URL);

app.use(cors());
app.use(helmet());
app.use(express.json());
//pass the redis client to the request object for use in routes
//why to pass the redis client to the request object? because we can use 
// it in the routes without importing it again and again
app.use('/api/posts', (req,res,next)=>{
    req.redisClient=redisClient; //what does this line do? 
    // it adds the redis client to the request object so that 
    // we can use it in the routes
    //why we need redis client in the routes? 
    // because we can use it to cache the posts and reduce the load on the database
    //how it works?
    // when a request comes to get posts, we first check if the posts are in the cache (redis)
    // if they are in the cache, we return them from the cache
    // if they are not in the cache, we fetch them from the database and store them in the cache for future requests
    // this way we can reduce the load on the database and improve the performance of the application
    // this is a middleware function that runs before the post routes, it adds the redis client to the request object so that we can use it in the routes
    next();
}, postRoutes);

app.use(errorHandler);

async function startServer(){
    try{
        await connectToRabbitMQ();
        app.listen(PORT,()=>{
            logger.info(`Post Service running on port ${PORT}`);
        });
    }
    catch(error){
        logger.error('Error starting the server', error);
    }
}
startServer()

