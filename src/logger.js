import { createLogger, transports, format } from "winston";

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

export { logger };
