import dotenv from 'dotenv';

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();
if (envFound.error) {
  // This error should crash whole process

  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

export default {
	/* Auth */
	xAPI : {
		enabled: process.env.EnabledAuthMethods.trim().toLowerCase().split(',').indexOf('xapikey') >= 0 ? true : false,
		apiKeys: process.env.XApiKeysPermitted.trim().split(',').map(a => {
		  return a.trim();
		}),
	},
	openID : {
		jwksUri : process.env.jwksUri
	},
  /**
   * Your favorite port
   */
  port: parseInt(process.env.listenOn, 10),
  
  /**
   * Cors
   */
   cors: {
		enabled: process.env.corsEnabled,
		domains: (process.env.allowedOrigins).split(',')	
   },

  /**
   * Database
   */
  databaseType: process.env.dbType,
  database : {
	server: process.env.dbUrl,
	port: process.env.dbPort,
	user: process.env.dbUser, // update me
	password: process.env.dbPass, // update me
	database: process.env.dbDatabase,
	pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
		enableArithAbort: true,
    }
  },

  /**
   * Your secret sauce
   */
  jwtSecret: process.env.JWT_SECRET,
  jwtAlgorithm: process.env.JWT_ALGO,

  /**
   * Used by winston logger
   */
  logs: {
    level: process.env.logLevel || 'debug',
	fileLogging: {
		enabled: process.env.fileLoggingEnabled,
		filelocation: process.env.fileLogDir
	},
	auditLogging: {
		enabled: process.env.auditfileLoggingEnabled,
		filelocation: process.env.auditfileLogDir
	}
  },

  /**
   * Agenda.js stuff
   */
  agenda: {
    dbCollection: process.env.AGENDA_DB_COLLECTION,
    pooltime: process.env.AGENDA_POOL_TIME,
    concurrency: parseInt(process.env.AGENDA_CONCURRENCY, 10),
  },

  /**
   * Agendash config
   */
  agendash: {
    user: 'agendash',
    password: '123456'
  },
  /**
   * API configs
   */
  api: {
    prefix: '/api',
  },
  /**
   * Mailgun email credentials
   */
  emails: {
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN
  }
};