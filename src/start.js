"use strict";

import { createLogger, transports, format } from "winston";
import { Token } from "./token";


const logger = createLogger({
	level: 'info',
	transports: [
		new transports.Console({level: 'debug'})
	],
	format: format.combine(format.timestamp(), format.splat(), format.printf((info) => {
		return `${info.timestamp} ${info.level} ${info.message}`;
	}))
});

logger.info("Hello world %d!", 17);




var t = new Token('campenberger', '602b2b207b084f339334446fe4eec064', 'eEbeZvRuVUepGo8pJGCuAtGXVQTsd7eX', logger);
t.getAccessToken((error, token)=>{
	logger.info(`access_token: ${error}, ${JSON.stringify(token)}`);
	t.getAccessToken((error, token)=>{
		logger.info(`access_token2: ${error}, ${JSON.stringify(token)}`);
	})
});

