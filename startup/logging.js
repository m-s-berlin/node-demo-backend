const winston = require('winston');
require('winston-mongodb');
require('express-async-errors');

module.exports = function () {
    winston.exceptions.handle(
        new winston.transports.Console({ colorize: true, prettyPrint: true }),
        new winston.transports.File({ filename: './logs/uncaughtExceptions.log' })
    );

    process.on('unhandledRejection', (ex) => {
        throw ex;
    });

    winston.add(new winston.transports.File({ filename: './logs/errors.log', level: 'error' }));
    winston.add(new winston.transports.File({ filename: './logs/combined.log' }));

    if (process.env.NODE_ENV !== 'production') {
        winston.add(new winston.transports.Console({ format: winston.format.simple() }));
    }
}