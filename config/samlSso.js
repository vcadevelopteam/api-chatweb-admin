const passport = require('passport')
const fs = require('fs')
const path = require('path');
const SamlStrategy = require('passport-saml').Strategy

// const idp = fs.readFileSync(path.resolve(__dirname, 'certs/claro.pem'), 'utf-8');
const pvkey = fs.readFileSync(path.resolve(__dirname, 'certs/pvkey.pem'), 'utf-8');

const IDP_CERT = process.env.IPD_SAML_CERT ?? '----';
const IDP_ENTRYPOINT = process.env.IDP_SAML_ENTRYPOINT ?? ''
const IDP_ISSUER = process.env.IDP_SAML_ISSUER ?? ''
const IDP_LOGOUTURL = process.env.IDP_SAML_LOGOUTURL ?? ''

const samlStrategy = new SamlStrategy(
	{
		path: '/api/auth/idps/saml20/sso',
		entryPoint: IDP_ENTRYPOINT,
		issuer: 'https://apiprd.laraigo.com/api/auth/idps/saml20',
		idpIssuer: IDP_ISSUER,
		callbackUrl: 'https://stagingapix.laraigo.com/api/auth/idps/saml20/sso',
		logoutUrl: IDP_LOGOUTURL,
		decryptionPvk: pvkey,
		privateKey: pvkey,
		cert: IDP_CERT,
		signatureAlgorithm: 'sha256',
		identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
	},
	// (profile, done) => done(null, profile),
    // (profile, done) => done(null, profile)
	function (profile, done) {
		console.log({ xml: profile.getAssertionXml() })
		console.log("🚀 ~ profile:", profile)
		return done(null, profile)
	}
)

passport.serializeUser(function (user, done) {
	console.log(`serialize user`, user)
	done(null, user)
})

passport.deserializeUser((user, done) => done(null, user))
passport.use('samlStrategy', samlStrategy)

module.exports = { samlStrategy }
