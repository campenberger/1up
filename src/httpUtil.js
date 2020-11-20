"use strict";

import { request } from "https";
import { stringify } from "querystring";

/**
 * Performs an url post to the given https url with args
 * encouded as x-www-form-urlencode.
 * cb is the callback that is called with
 *		- error object
 * 		- result handle
 * 		- json decoded payload
 */
function formPost(url, args, logger, cb) {
	let data = stringify(args);
	logger.debug(`formPost: Data ${data}`);

	let req=request(
		url,
		{ method: 'POST',
			headers: {
				'Content-Length': Buffer.byteLength(data),
				'Content-Type': 'application/x-www-form-urlencoded',
				'Accept': 'application/json'
			}
		},
		(res) => {
			let resultData=Buffer.alloc(0);

			res.on('data', (d) => {
				resultData = Buffer.concat([resultData, d]);
			});

			res.on('end', ()=>{
				resultData=resultData.toString()
				logger.debug("Received result: %s", resultData);
				if (res.statusCode!=200) {
					logger.error(`Request to ${url} failed with ${res.statusCode}: ${resultData}`);
					logger.debug(`Headers: ${JSON.stringify(res.headers)}`);
					cb(new Error(`Request finished with status code ${res.statusCode}`), null, null);
					return;
				} else {
					cb(null, res, JSON.parse(resultData));
				}
			});
		}
	);

	req.on('error', (e)=>{
		logger.error(`Request error for ${url}: ${e}`);
		cb(e, null, null);
	});
	req.write(data);
	req.end();
}

export {formPost};
