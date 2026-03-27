//what is winston?
//Winston is a versatile logging library for Node.js that provides a simple and flexible way to log messages 
//in various formats and transports. It allows developers to log messages to the console, files, databases,
//and other destinations with different levels of severity (e.g., error, warn, info, debug). 
// Winston supports features like log rotation, custom formatting, and integration with external logging services, 
// making it a popular choice for managing application logs effectively.

const winston = require('winston');

const logger=winston.createLogger({
    level: process.env.NODE_ENV=== 'production' ? 'info' : 'debug',// The minimum level of messages to log (e.g., 'error', 'warn', 'info', 'debug')
    format:winston.format.combine(// Combines multiple formatting functions into a single format
        winston.format.timestamp(),  // Adds a timestamp to each log message   
        winston.format.errors({stack:true}), // Captures and includes stack traces for error messages
        winston.format.splat(), // Allows for string interpolation in log messages (e.g., logger.info('User %s logged in', username))
        winston.format.json() // Formats log messages as JSON objects for structured logging
        // Custom format for log messages, including timestamp, log level, and message content
    ),
    defaultMeta:{service:'identity-service'},// Default metadata to include with each log message (e.g., service name)
    transports:[    
        new winston.transports.Console({
            format:winston.format.combine(
                winston.format.colorize(), // Adds color to log messages based on their level (e.g., errors in red, warnings in yellow)
                winston.format.simple() // Formats log messages in a simple, human-readable format (e.g., 'info: User logged in')
            )
        }),// Logs messages to the console (standard output)
        new winston.transports.File({filename:'error.log', level:'error'}),// Logs error messages to a file named 'error.log'
        new winston.transports.File({filename:'combined.log'})// Logs all messages (including errors, warnings, and info) to a file named 'combined.log'
    ]
})
module.exports=logger;  
