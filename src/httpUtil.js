"use strict";

import { request } from "https";
import { stringify } from "querystring";
import { logger } from "./logger";

// Helper function that reads the result data from the responds,
// json decoded it and calls callback with the data. The callback
// has the arguments:
// - error
// - response object from request
// - data decoded
//
function fetchResult(res, url, cb) {
	let resultData=Buffer.alloc(0);

	res.on('data', (d) => {
		resultData = Buffer.concat([resultData, d]);
	});

	res.on('end', ()=>{
		resultData=resultData.toString()
		if (res.statusCode!=200) {
			logger.error(`Request to ${url} failed with ${res.statusCode}: ${resultData}`);
			logger.debug(`Headers: ${JSON.stringify(res.headers)}`);
			cb(new Error(`Request finished with status code ${res.statusCode}`), res, null);
			return;
		} else {
			cb(null, res, JSON.parse(resultData));
		}
	});
}

/**
 * Performs a POST to the given https url with args
 * encouded as x-www-form-urlencode.
 * cb is the callback that is called with
 *		- error object
 * 		- result handle
 * 		- json decoded payload
 */
function formPost(url, args, cb) {
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
		(res) => { fetchResult(res, url, cb); }
	);

	req.on('error', (e)=>{
		logger.error(`Request error for ${url}: ${e}`);
		cb(e, null, null);
	});
	req.write(data);
	req.end();
}

/**
 * Perfoms a GET reqeust to the given URL. If args are
 * given they will be appended as query parameters. cb is
 * called when the request finished"
 * 	- error object
 *  - response object from request
 *  - data decoded
 */
function jsonGet(url, args, access_token, cb) {
	if(args!=null) {
		url=url+"?"+stringify(args);
	}
	let req=request(
		url,
		{ method: 'GET',
		  headers: {
		  	'Accept': 'application/json',
		  	'Authorization': `Bearer ${access_token}`
		  }
		},
		(res) => { fetchResult(res, url, cb); }
	);

	req.on('error', (e)=>{
		logger.error(`Request error for ${url}: ${e}`);
		cb(e, null, null);
	});
	req.end();
}

export {formPost, jsonGet};
