"use strict";

import { formPost } from "./httpUtil";

// class that takes logger, code, client_id and secret.
//	fetches access_token and refreshes with 10 seconds of expiry
class Token {
	constructor(user_id, client_id, client_secret, logger) {
		this.token = null;
		this.user_id = user_id;
		this.client_id = client_id;
		this.client_secret = client_secret;
		this.logger = logger;
	}


	// Uses the app crendentials to get an exchange code and calls callback with
	//	- error
	//  - retrieved code
	_getCode(cb) {
		formPost(
			"https://api.1up.health/user-management/v1/user/auth-code",
			{app_user_id: this.user_id, client_id: this.client_id, client_secret: this.client_secret},
			this.logger,
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
			this.logger,
			(error, res, token)=>{
				cb(error, token);
			}
		);
	}

	getAccessToken(cb) {
		if(this.token==null || Date.now()>=this.token.expires_at.valueOf()-1000*600) {
			this.logger.debug("getAccessToken: No token present or expired, fetching a new one");
			this._getCode((error, code)=>{
				this.logger.debug(`getAccessToken: _getCode(${error}, ${code}) cb called`);
				if(error==null) {
					this._getNewAccessToken(code, (error, token)=>{
						this.token=token;
						this.token.expires_at = new Date(Date.now() + 1000*this.token.expires_in);
						this.logger.debug(`getAccessToken: New token expires at ${token.expires_at.toISOString()}`);
						cb(error, this.token);
					});
				} else {
					cb(error, null);
				}
			});
		} else {
			this.logger.debug("We have a valid token, so we can just do what we have to do");
			cb(null, this.token);
		}
	}
}

export {Token};
