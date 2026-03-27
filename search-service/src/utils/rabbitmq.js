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

const consumeMessage = async (routingKey, callback) => {
    if (!channel) {
        await connectToRabbitMQ();
    }

    const serviceName = process.env.SERVICE_NAME || 'search-service';
    const queueName = `${serviceName}.${routingKey}`;
    const q = await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);

    await channel.consume(
        q.queue,
        async (message) => {
            if (!message) return;

            try {
                const parsedMessage = JSON.parse(message.content.toString());
                await callback(parsedMessage);
                channel.ack(message);
            } catch (error) {
                logger.error(`Error consuming message for routing key ${routingKey}`, error);
                channel.nack(message, false, false);
            }
        },
        { noAck: false }
    );

    logger.info(`Consuming messages from RabbitMQ queue ${queueName} for key ${routingKey}`);
    return q;
};
module.exports={connectToRabbitMQ,consumeMessage};