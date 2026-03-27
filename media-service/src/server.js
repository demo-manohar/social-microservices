require('dotenv').config();

const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');
const helmet=require('helmet');
const errorHandler=require('./middleware/errorHandler');
const logger=require('./utils/logger');
const mediaRoutes=require('./routes/media-routes');
const Redis=require('ioredis');
const routes=require('./routes/media-routes');
require('dotenv').config();
const { connectToRabbitMQ, consumeMessage } = require('./utils/rabbitmq');
const { handlePostDeleted } = require('./eventHandlers/media-event-handlers');
const app=express();
const PORT=process.env.PORT || 3004;
const redisClient=new Redis(process.env.REDIS_URL);

mongoose.connect(process.env.MONGODB_URI).then(()=>{
    logger.info('Connected to MongoDB');
}).catch((err)=>{
    logger.error('Error connecting to MongoDB', err);
})
app.use(express.json());
app.use(cors());
app.use(helmet());

app.use(routes);

app.use('/api/media', mediaRoutes);
app.use(errorHandler);
async function startServer(){
  try{
    await connectToRabbitMQ();
    await consumeMessage('post.deleted',handlePostDeleted)
    app.listen(PORT,()=>{
        logger.info(`Media service is running on port ${PORT}`);
    });
  }catch(error){
    logger.error('Error starting server', error);
    process.exit(1);
  }
}
startServer();