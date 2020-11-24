This little application uses the 1up.health FHIR dstu2 API to show a list of patient
loaded into 1up.health from an EHR system and to show all available details for a
particular patient.

## Running the application

The easiest way to run the application is through the following steps:

* Register an application in the 1up developer console and make note of the user id,
  client id and client secret. The application should be registered with a callback URL
  of http://localhost:5000
* Run the application with

		docker run --rm -it -p 5000:5000 \
			-e APP_USER_ID=... \
			-e CLIENT_ID=... \
			-e CLIENT_SECRET=...
			-e LOGLEVEL=info \
			campenberger/1up run

* Point the browser to http://localhost:5000/ and login with at the ${APP_PASSWORD} value.
  The default is "Geheim".

* The application has several other parameters that can be configured by setting environment
  variables. Those are documented in env.inc.sample


## Running in a development environment

* Like before register an application in the 1up developer console
* Install the required node modules with ```npm install```
* Copy env.inc.sample to env.inc and customize the settings
* Run the application with ```./run.sh```

There are several npm run scripts that can be used:

* clean - remove the build directory
* lint - Run eslint on the code base
* compile - Compile the ES6 into plain java script
* build - Run the prior scripts and build a local docker image


## State of the Code

There are several limitations to the current state of the code base that should be pointed out:

* The application can only handle one source EHR system for patients, which defaults to the
  Cerner Test EHR. This is set by the variable SYSTEM_ID.
* The patient list does not support pagination and only the first 100 patients will be shown.
* There is very limited error handling and a wrong patient for example will result in a bare
  bone 404 error with a stack trace. This is not good practice and would need to be fixed for
  a real application.
* An authenticated user is tracked through a session cookie. However, only two of the cookie
  parameters can be configured.
