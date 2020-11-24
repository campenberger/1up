'use strict'

import { getRequestAccessToken } from './token'
import { logger, accessLogFilter } from './logger'
import { jsonGet } from './httpUtil'

import express from 'express'
import nunjucks from 'nunjucks'
import cookieSession from 'cookie-session'
import querystring from 'querystring'

const port = parseInt(process.env.PORT || '5000', 10)
const healthSystemId = process.env.SYSTEM_ID || '4707'
const appPassword = process.env.APP_PASSWORD || 'Geheim'
const sessionCookieName = process.env.SESSION_COOKIE_NAME || '1up'
const sessionCookieMaxAge = parseInt(process.env.SESSION_TIMEOUT || '60', 10) * 60000
const sessionSecret = process.env.SESSION_SECRET || 'SuperGeheim'

const loginUrl = '/login'

// Fetches the patient record and the $everything queri for a
// patient by patient_id and returns an all promise with the results
// of both requests.
function fetchPatient(patient_id, access_token) {
    const url = `https://api.1up.health/fhir/dstu2/Patient/${patient_id}`
    return Promise.all([
        // get the main patient data
        new Promise((resolve, reject) => {
            jsonGet(url, null, access_token, (err, res, data) => {
                if (err == null) {
                    resolve(data)
                } else {
                    reject(err)
                }
            })
        }),

        // do the everything query for the same
        new Promise((resolve, reject) => {
            jsonGet(url + '/$everything', null, access_token, (err, res, data) => {
                if (err == null) {
                    resolve(data)
                } else {
                    reject(err)
                }
            })
        })
    ])
}

// Fetches a list of patients associated with the account and returns a
// promise with theresult object
function fetchPatientList(access_token) {
    const url = 'https://api.1up.health/fhir/dstu2/Patient/'
    return new Promise((resolve, reject) => {
        jsonGet(url, null, access_token, (err, res, data) => {
            if (err == null) {
                resolve(data)
            } else {
                reject(err)
            }
        })
    })
}

// Filter that checks whether the user has given a valid access code.
// If not, the user will we redirected to the target page.
function loginFilter(redirectUrl) {
    return (req, res, next) => {
        if (req.session.userIsLoggedIn) {
            logger.debug('loginFilter: user is logged in.')
            // increment, so the session is refreshed
            req.session.count = (req.session.count || 0) + 1
            next()
        } else {
            const target = redirectUrl + '?' + querystring.stringify({ target: req.originalUrl, error: null })
            logger.debug('loginFilter: user is not logged in. Redirecting to %s', target)
            res.redirect(302, target)
        }
    }
}

// set up the express app,
const app = express()
    .use(accessLogFilter)
    .use(express.urlencoded({ extended: true }))
    .use(cookieSession({
        name: sessionCookieName,
        maxAge: sessionCookieMaxAge,
        secret: sessionSecret
    }))

// configure the templating system
nunjucks.configure('views', {
    autescape: true,
    express: app
})

// Default landing page with list of linked patients
app.get('/', loginFilter(loginUrl), getRequestAccessToken, (req, res, next) => {
    res.set('Cache-Control', 'no-store')
    fetchPatientList(req.params.access_token)
        .then((result) => {
            res.render('home.html', { bundle: result })
        })
        .catch((error) => {
            logger.error(`Fetching a list of patients failed: ${error}`)
            next(error)
        })
})

// Fetch the patients data and render in a template
app.get('/patient/:id', loginFilter(loginUrl), getRequestAccessToken, (req, res, next) => {
    res.set('Cache-Control', 'no-store')
    fetchPatient(req.params.id, req.params.access_token)
        .then((results) => {
            res.render('patient.html', {
                patient: results[0],
                everything: results[1],
                access_token: req.params.access_token
            })
        }).catch((error) => {
            logger.error(`Fetching patient data for id ${req.params.id} failed: ${error}`)
            next(error)
        })
})

// Uses the connect api to add another patient to the application
app.get('/add_patient', loginFilter(loginUrl), getRequestAccessToken, (req, res, next) => {
    const redirectUrl = `https://api.1up.health/connect/system/clinical/${healthSystemId}?client_id=${req.params.client_id}&access_token=${req.params.access_token}`
    logger.info('Redirecting to %s', redirectUrl)
    res.redirect(302, redirectUrl)
})

// login page get handler to render the page. It will redirect to the
// targetPage, if the user is already logged in.
app.get('/login', (req, res, next) => {
    res.set('Cache-Control', 'no-store')
    const targetPage = req.query.target || '/'
    if (req.session.userIsLoggedIn) {
        logger.debug('User already logged in, redirecting to %s', targetPage)
        res.redirect(302, targetPage)
    } else {
        res.render('login.html',
            {
                target: targetPage,
                error: (req.query.error || null)
            }
        )
    }
})

// login page post handler, that attempts to login in the user. If successful
// or when the user is already logged in, it redirects to the target page. If the
// attempt fails, it redirects to the login page, with an error message
app.post('/login', (req, res, next) => {
    res.set('Cache-Control', 'no-store')
    const targetPage = req.body.target || '/'
    if (req.session.userIsLoggedIn) {
        res.redirect(302, targetPage)
    } else {
        if (req.body.password === appPassword) {
            logger.info('Successful login. Redirecting to target %s', targetPage)
            req.session.userIsLoggedIn = true
            res.redirect(302, targetPage)
        } else {
            const loginRedirect = loginUrl + '?' + querystring.stringify({ target: targetPage, error: 'Invalid Access Code' })
            logger.info('Invalid login. Redirecting to %s', loginRedirect)
            res.redirect(302, loginRedirect)
        }
    }
})

// start the application server
app.listen(port, () => {
    logger.info('Express listen on %d', port)
})
