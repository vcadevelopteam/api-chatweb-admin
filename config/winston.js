const { createLogger, format, transports } = require("winston");
const logdnaWinston = require('logdna-winston');

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
    env: "testing",
    level: logLevel, // Default to debug, maximum level of log, doc: https://github.com/winstonjs/winston#logging-levels
    indexMeta: true // Defaults to false, when true ensures meta object will be searchable
}

const logger = createLogger({
    levels,
    level: logLevel,
    format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), format.json()),
    transports: [
        new transports.Console(),
        new transports.File({ filename: `logs/all-${new Date().toISOString().substring(0, 10)}.log` }),
        new transports.File({ filename: `logs/err-${new Date().toISOString().substring(0, 10)}.log`, level: "error" }),
    ],
    exceptionHandlers: [new transports.File({ filename: "logs/exceptions.log" })],
    rejectionHandlers: [new transports.File({ filename: "logs/rejections.log" })],
    exitOnError: false
});

if (env !== "development") {
    logger.add(new logdnaWinston(options));
}

module.exports = logger;
