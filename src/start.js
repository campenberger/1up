"use strict";

import { getRequestAccessToken } from "./token";
import { logger, accessLogFilter } from "./logger";
import { jsonGet } from "./httpUtil";

import express from "express";
import nunjucks from "nunjucks";


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



const app=express()
	.set("view engine", "jade")
	.use(accessLogFilter);


nunjucks.configure("views", {
	autescape: true,
	express: app
})

app.get('/', (req, res)=>{
	res.render("home.html");
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
		logger.error(`Request failed: ${error}`);
		next(error);
	})

});

const port=5000;
app.listen(port, ()=>{
	logger.info("Express listen on %d", port)
});
