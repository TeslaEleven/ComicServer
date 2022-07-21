const express = require('express')
const app = express()
const session = require('express-session')
const bodyParser = require('body-parser')
const pug = require('pug')
const ms = require("ms")

// define middleware functions
let PP = {
    session: 
    	session({
			secret: 'passwordProtected',
			resave: false,
			saveUninitialized: true,
			unset: 'destroy',
			name: 'passwordProtected',
			cookie: {
				maxAge: ms("1h")
			}
		}),
    configure: 
    	function(options) {
    		return function(req, res, next) {
    			if(!req.session.PP) {
    				req.session.PP = {
            username: process.env.UNAME,
            password: process.env.AUTH,
    				loggedIn: false
    				}
    			}
				next()    			
    		}
    	},    
    login: 
    	function(req, res, next) {
    		console.log("body   ", req.body)
			// check if logged in using session, continue to other express routes in app    		
    		if(req.session.PP && req.session.PP.loggedIn) {
				console.log('Already Logged In')
    			next()
    		}
			// attempting to login using password protected login form; check username and password; if so, let proceed and save loggedIn as true   		
			else if(req.body && (req.body.uname == req.session.PP.username) && (req.body.pass == req.session.PP.password)) {
				req.session.PP.loggedIn = true
				console.log('Logged In')
				next()
			}
			// deny access
			else {
				console.log('Denied')
				res.send(pug.renderFile(__dirname + '/loginPage.pug'))
			}		

    	}
}

// return multiple middleware functions as array inside function with options parameter
module.exports = function(options) {
  return [bodyParser.urlencoded({extended: true}), PP.session, PP.configure(options), PP.login]
}
