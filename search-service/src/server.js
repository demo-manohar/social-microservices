require('dotenv').config();
const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');
const helmet=require('helmet');
const errorHandler=require('./middleware/errorHandler');
const logger=require('./utils/logger');
const searchRoutes=require('./routes/search-routes');
const {connectToRabbitMQ}=require('./utils/rabbitmq');
const {validateToken}=require('./middleware/authMiddleware');

const Redis=require('ioredis');

const {consumeMessage}=require('./utils/rabbitmq');
const { handlePostCreated, handlePostDeleted } = require('./eventHandlers/searchEvent');

const app=express();
const PORT=process.env.PORT || 3005;

mongoose.connect(process.env.MONGODB_URI).then(()=>{
    logger.info('Connected to MongoDB');
}).catch((err)=>{
    logger.error('Error connecting to MongoDB', err);
});

const redisClient=new Redis(process.env.REDIS_URL);

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req,res,next)=>{
    logger.isInfoEnabled(`Request received: ${req.method} ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
});

app.use('/api/search',searchRoutes);

app.use(errorHandler);

async function startServer(){
   try{
    await connectToRabbitMQ();
    await consumeMessage('post.created',handlePostCreated)
    logger.info('Listening for post.created events');
    console.log('Listening for post.created events');
    await consumeMessage('post.deleted',handlePostDeleted)
    logger.info('Listening for post.deleted events');
    app.listen(PORT,()=>{
        logger.info(`Search service is running on port ${PORT}`);
    });

   }catch(error){
    logger.error('Error starting server',error);
    process.exit(1);
   }
}
startServer();




