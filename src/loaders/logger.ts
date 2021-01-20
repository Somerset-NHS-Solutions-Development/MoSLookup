import winston, { format } from 'winston';
import config from '../config';
import DailyRotateFile = require("winston-daily-rotate-file");
const fs = require('fs');
const path = require('path');

const myTransports = [];
// Console Logging
if(process.env.NODE_ENV !== 'development') {
  myTransports.push(
    new winston.transports.Console()
  )
} else {
  myTransports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.cli(),
        winston.format.splat(),
      )
    })
  )
}

// File Logging
if(config.logs.fileLogging.enabled.toLowerCase() === 'true'){
	if (!fs.existsSync(config.logs.fileLogging.filelocation)) {
	  fs.mkdirSync(config.logs.fileLogging.filelocation);
	}
	const dailyLog = new (DailyRotateFile)({
		filename: `${config.logs.fileLogging.filelocation}/%DATE%-app.log`,
		datePattern: 'YYYY-MM-DD',
		format: winston.format.combine(
				winston.format.printf(
				  info =>
					`${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
				)
			)
		})
	
	
	myTransports.push(dailyLog);
}

const LoggerInstance = winston.createLogger({
  level: config.logs.level,
  levels: winston.config.npm.levels,
  format: winston.format.combine(
	winston.format.label({ label: 'app' }),
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: myTransports
});

export default LoggerInstance;