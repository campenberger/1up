"use strict";

import { formPost } from "./httpUtil";
import { logger } from "./logger";

// class that takes logger, code, client_id and secret.
//	fetches access_token and refreshes with 10 seconds of expiry
class Token {
	constructor(user_id, client_id, client_secret) {
		this.token = null;
		this.user_id = user_id;
		this.client_id = client_id;
		this.client_secret = client_secret;
	}


	// Uses the app crendentials to get an exchange code and calls callback with
	//	- error
	//  - retrieved code
	_getCode(cb) {
		formPost(
			"https://api.1up.health/user-management/v1/user/auth-code",
			{app_user_id: this.user_id, client_id: this.client_id, client_secret: this.client_secret},
			(error, res, data)=>{
				if(error!=null) {
					cb(error, null);
				} else {
					cb(null, data.code);
				}
			}
		);
	}

	// Uses the given code and exchanges it in into an access token and then calls cb with
	// - error
	// - access_token
	_getNewAccessToken(code, cb) {
		formPost(
			"https://api.1up.health/fhir/oauth2/token",
			{app_user_id: this.user_id, client_id: this.client_id, client_secret: this.client_secret, grant_type: "authorization_code", code: code},
			(error, res, token)=>{
				cb(error, token);
			}
		);
	}

	/**
	 * Calls cb with access token, with the present access token.
	 * The token will issued when not already present or expired.
	 */
	getAccessToken(cb) {
		if(this.token==null || Date.now()>=this.token.expires_at.valueOf()-1000*600) {
			logger.debug("getAccessToken: No token present or expired, fetching a new one");
			this._getCode((error, code)=>{
				logger.debug(`getAccessToken: _getCode(${error}, ${code}) cb called`);
				if(error==null) {
					this._getNewAccessToken(code, (error, token)=>{
						this.token=token;
						this.token.expires_at = new Date(Date.now() + 1000*this.token.expires_in);
						logger.debug(`getAccessToken: New token expires at ${token.expires_at.toISOString()}`);
						cb(error, this.token);
					});
				} else {
					cb(error, null);
				}
			});
		} else {
			logger.debug("We have a valid token, so we can just do what we have to do");
			cb(null, this.token);
		}
	}
}

/**
 * The application token initialized with the application settings.
 */
const appToken = new Token('campenberger', '602b2b207b084f339334446fe4eec064', 'eEbeZvRuVUepGo8pJGCuAtGXVQTsd7eX');


/**
 * Express app middleware that makes sure we have an access token and injects
 * the value into the request, before express moves forward in the pipeline
 */
function getRequestAccessToken(req, res, next) {
	appToken.getAccessToken((error, token)=>{
		if(error==null) {
			req.params.access_token=token.access_token;
			next();
		} else {
			logger.error(`Unable to get access token: ${error}`)
			next(error);
		}
	});

}

export {appToken, Token, getRequestAccessToken};
