const express = require('express')
const app = express()
const session = require('express-session')
const bodyParser = require('body-parser')
const pug = require('pug')

let PP = {
    session: 
    	session({
			secret: 'credentials',
			resave: false,
			saveUninitialized: true,
			unset: 'destroy',
			name: 'credentials',
			cookie: {
				maxAge: 3600000
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
    		if(req.session.PP && req.session.PP.loggedIn) {
    			next()
    		}
			else if(req.body && (req.body.uname == req.session.PP.username) && (req.body.pass == req.session.PP.password)) {
				req.session.PP.loggedIn = true
				next()
			}
			// deny access
			else {
        res.sendFile(__dirname + "/" + "login.html");
			}		

    	}
}

module.exports = function(options) {
  return [bodyParser.urlencoded({extended: true}), PP.session, PP.configure(options), PP.login]
}