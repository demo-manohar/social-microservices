//what is rabbitmq?
//rabbitmq is a message broker that is used to send messages between services
//how it works?
// when a request comes to create a post, we send a message to the rabbitmq broker
// the rabbitmq broker then sends the message to the media service
// the media service then uploads the media to the cloudinary
// the media service then returns the media id to the post service
// the post service then stores the media id in the database
// how to connect to the rabbitmq?
// we use the amqplib library to connect to the rabbitmq
// we use the connect function to connect to the rabbitmq
// we use the channel function to create a channel
// we use the sendToQueue function to send a message to the rabbitmq
// we use the consume function to consume a message from the rabbitmq
// we use the close function to close the connection to the rabbitmq
// we use the assertQueue function to assert a queue
// we use the sendToQueue function to send a message to the rabbitmq
// we use the consume function to consume a message from the rabbitmq
// we use the close function to close the connection to the rabbitmq
// we use the assertQueue function to assert a queue
// we use the sendToQueue function to send a message to the rabbitmq
// we use the consume function to consume a message from the rabbitmq
// we use the close function to close the connection to the rabbitmq
// we use the assertQueue function to assert a queue
const amqp=require('amqplib');
const logger=require('./logger');

let channel=null; //channel is a queue that is used to send messages to the rabbitmq
let connection=null; //connection is a connection to the rabbitmq

const EXCHANGE_NAME='facebook_events';//exchange is a topic that is used to send messages to the rabbitmq

const connectToRabbitMQ=async ()=>{
    try{
        connection=await amqp.connect(process.env.RABBITMQ_URL);
        channel=await connection.createChannel();//create a channel to the rabbitmq
       await channel.assertExchange(EXCHANGE_NAME,'topic',{durable:true});//assert an exchange to the rabbitmq
       logger.info('Connected to RabbitMQ');
       return channel;
    }
    catch(error){
        logger.error('Error connecting to RabbitMQ', error);
        throw new Error('Error connecting to RabbitMQ');
    }
}
const publishMessage=async (routingKey,message)=>{//publish a message to the rabbitmq routing key is the key that is used to route the message to the rabbitmq
    
    if(!channel){//if the channel is not connected, connect to the rabbitmq
        await connectToRabbitMQ();
    }
    try{
        await channel.publish(EXCHANGE_NAME,routingKey,Buffer.from(JSON.stringify(message)));//publish a message to the rabbitmq
        logger.info(`Message published to RabbitMQ: ${message}`);
    }
    catch(error){
        logger.error('Error publishing message to RabbitMQ', error);
        throw new Error('Error publishing message to RabbitMQ');
    }
}
module.exports={connectToRabbitMQ,publishMessage};