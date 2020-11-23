"use strict";

import { getRequestAccessToken } from "./token";
import { logger, accessLogFilter } from "./logger";
import { jsonGet } from "./httpUtil";

import express from "express";
import nunjucks from "nunjucks";

const port=5000;
const health_system_id=4707;

// Fetches the patient record and the $everything queri for a
// patient by patient_id and returns an all promise with the results
// of both requests.
function fetchPatient(patient_id, access_token) {
	let url=`https://api.1up.health/fhir/dstu2/Patient/${patient_id}`;
	return Promise.all([
		// get the main patient data
		new Promise((resolve, reject)=>{
			jsonGet(url, null, access_token, (err, res, data)=>{
				if(err==null) {
					resolve(data);
				} else {
					reject(err);
				}
			});
		}),

		// do the everything query for the same
		new Promise((resolve, reject)=>{
			jsonGet(url+'/$everything', null, access_token, (err, res, data)=>{
				if(err==null) {
					resolve(data);
				} else {
					reject(err);
				}
			});
		})
	]);
}


// Fetches a list of patients associated with the account and returns a
// promise with theresult object
function fetchPatientList(access_token) {
	let url='https://api.1up.health/fhir/dstu2/Patient/';
	return new Promise((resolve, reject)=>{
		jsonGet(url, null, access_token, (err, res, data)=>{
			if(err==null) {
				resolve(data);
			} else {
				reject(err);
			}
		});
	});
}

const app=express()
	.set("view engine", "jade")
	.use(accessLogFilter);


nunjucks.configure("views", {
	autescape: true,
	express: app
})

// Default landing page with list of linked patients
app.get('/',getRequestAccessToken, (req, res, next)=>{
	fetchPatientList(req.params.access_token)
	.then((result)=>{
		res.render("home.html", {bundle: result});
	})
	.catch((error)=>{
		logger.error(`Fetching a list of patients failed: ${error}`);
		next(error);
	});
});

// Fetch the patients data and render in a template
app.get('/patient/:id', getRequestAccessToken, (req, res, next)=>{

	fetchPatient(req.params.id, req.params.access_token).then((results)=>{
		res.render("patient.html", {
			patient: results[0],
			everything: results[1],
			access_token: req.params.access_token
		})

	}).catch((error)=>{
		logger.error(`Fetching patient data for id ${req.params.id} failed: ${error}`);
		next(error);
	})

});

// Uses the connect api to add another patient to the application
app.get('/add_patient', getRequestAccessToken, (req, res, next)=>{
	var redirectUrl=`https://api.1up.health/connect/system/clinical/${health_system_id}?client_id=${req.params.client_id}&access_token=${req.params.access_token}`;
	logger.info("Redirecting to %s", redirectUrl);
	res.redirect(302, redirectUrl);
});

app.listen(port, ()=>{
	logger.info("Express listen on %d", port)
});
