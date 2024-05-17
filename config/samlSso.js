const passport = require('passport')
const fs = require('fs')
const path = require('path');
console.log('Current working directory:', process.cwd());
// const Strategy = require('@node-saml/passport-saml').Strategy
const SamlStrategy = require('passport-saml').Strategy

const idp = fs.readFileSync(path.resolve(__dirname, 'certs/claro.pem'), 'utf-8');
const pvkey = fs.readFileSync(path.resolve(__dirname, 'certs/pvkey.pem'), 'utf-8');

const samlStrategy = new SamlStrategy(
	{
		path: '/api/auth/idps/saml20/sso',
		entryPoint: 'https://devidentidades.claro.com.pe/isam/sps/QuickFed/saml20/login',
		issuer: 'https://devidentidades.claro.com.pe/isam/sps/QuickFed/saml20',
		idpIssuer: 'https://devidentidades.claro.com.pe/isam/sps/QuickFed/saml20',
		callbackUrl: 'https://testapix.laraigo.com/api/auth/idps/saml20/sso',
		decryptionPvk: pvkey,
		privateKey: pvkey,
		cert: idp,
	},
	(profile, done) => done(null, profile),
	(profile, done) => done(null, profile)
)

passport.serializeUser(function (user, done) {
	console.log(`serialize user`, user)
	done(null, user)
})

passport.deserializeUser((user, done) => done(null, user))
passport.use('samlStrategy', samlStrategy)

module.exports = { samlStrategy }
