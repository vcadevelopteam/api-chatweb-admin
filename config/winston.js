const { createLogger, format, transports } = require("winston");
require('winston-daily-rotate-file');
const logdnaWinston = require('logdna-winston');

const currentDate = new Date().toISOString().substring(0, 10);

const levels = {
    error: 0,   //error on catch exception
    warn: 1,    //error on request from api
    info: 2,    //input and output on request + requests to our api  
    debug: 3,   //queries on trigger functions
}

const env = process.env.NODE_ENV || 'development';
const logLevel = process.env.LOG_LEVEL || "debug";

//options to logDNA
const options = {
    key: "c5741e56fbfaca0efbe617438fa8efee",
    app: `api_laraigo_${env}`,
    env: env,
    level: logLevel, // Default to debug, maximum level of log, doc: https://github.com/winstonjs/winston#logging-levels
    indexMeta: true // Defaults to false, when true ensures meta object will be searchable
}

const logger = createLogger({
    levels,
    level: logLevel,
    format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), format.json()),
    transports: [
        new transports.Console(),
        new transports.DailyRotateFile({
            dirname: './logs',
            filename: "all-%DATE%.log",
            datePattern: 'YYYY-MM-DD',
        }),
        new transports.DailyRotateFile({
            dirname: './logs',
            filename: "err-%DATE%.log",
            datePattern: 'YYYY-MM-DD',
            level: "error"
        }),
    ],
    exceptionHandlers: [new transports.File({ filename: `logs/exceptions-${currentDate}.log` })],
    rejectionHandlers: [new transports.File({ filename: `logs/rejections-${currentDate}.log` })],
    exitOnError: false
});

if (env !== "development") {
    logger.add(new logdnaWinston(options));
}

module.exports = logger;
