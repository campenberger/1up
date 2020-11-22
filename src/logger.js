"use strict";

import { createLogger, transports, format } from "winston";
import morgan from "morgan";

/**
 * Configures the logger - just a placeholder for a more elaborate
 * configuration, if needed. At this point the default level is debug,
 * but can be overwritten by an environment variable.
 */
const logger = createLogger({
	// level: 'info',
	transports: [
		new transports.Console({level: 'debug'})
	],
	format: format.combine(format.timestamp(), format.splat(), format.printf((info) => {
		return `${info.timestamp} ${info.level} ${info.message}`;
	}))
});


// configure morgan
morgan.token('remote-user', req => req.user);
morgan.token('exchange', req => req._exchange);
morgan.format('http', ':remote-user :remote-addr :method :url HTTP/:http-version :status :res[content-length] - :response-time ms');

// construct an access log filter that writes requests to the winston logger
const accessLogFilter = morgan('http', {
	stream: {
		write: (message)=>{
			logger.info(message);
		}
	}
});

export { logger, accessLogFilter };
