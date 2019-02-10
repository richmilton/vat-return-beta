require('dotenv').config();
//const simpleOauthModule = require('simple-oauth2');
//const request = require('superagent');
const express = require('express');

const winston = require('winston');
const log = winston.createLogger({
  transports: [
    new winston.transports.Console()
  ]
});

//const serverToken = '74c91e7bbdd7d8ce70fd111968c4b72b';
const simpleOauthModule = require('simple-oauth2');
const appPort = process.env.APP_PORT;
const oauthScope = 'read:vat write:vat';

const cookieSession = require('cookie-session');
const redirectUri = `http://localhost:${appPort}/`;

const oauth2 = simpleOauthModule.create({
  client: {
    id: process.env.HMRC_API_CLIENT_ID,
    secret: process.env.HMRC_API_CLIENT_SECRET,
  },
  auth: {
    tokenHost: process.env.HMRC_API_BASE_URL,
    tokenPath: '/oauth/token',
    authorizePath: '/oauth/authorize',
  },
});

const authorizationUri = oauth2.authorizationCode.authorizeURL({
  redirect_uri: redirectUri,
  response_type: 'code',
  scope: oauthScope,
});


const app = express();

app.use(cookieSession({
  name: 'session',
  keys: ['oauth2Token', 'caller'],
  maxAge: 10 * 60 * 60 * 1000 // 10 hours
}));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  console.log(req.session);

  //get obligations

  res.render('index', {
    loggedIn: req.session.oauth2Token || false,

  });
});

app.get("/userCall",(req,res) => {
  if(req.session.oauth2Token){
    var accessToken = oauth2.accessToken.create(req.session.oauth2Token);

    if(accessToken.expired()){
      log.info('Token expired: ', accessToken.token);
      accessToken.refresh()
        .then((result) => {
          log.info('Refreshed token: ', result.token);
          req.session.oauth2Token = result.token;
          callApi(userRestrictedEndpoint, res, result.token.access_token);
        })
        .catch((error) => {
          log.error('Error refreshing token: ', error);
          res.send(error);
        });
    } else {
      log.info('Using token from session: ', accessToken.token);
      callApi(userRestrictedEndpoint, res, accessToken.token.access_token);
    }
  } else {
    log.info('Need to request token')
    req.session.caller = '/userCall';
    res.redirect(authorizationUri);
  }
});

app.get("/logout", (req, res) => {
  req.session.oauth2Token = null;
  res.redirect('/');
});

const callApi = (resource, res, bearerToken) => {
  const acceptHeader = `application/vnd.hmrc.${serviceVersion}+json`;
  const url = apiBaseUrl + serviceName + resource;
  log.info(`Calling ${url} with Accept: ${acceptHeader}`);
  const req = request
    .get(url)
    .accept(acceptHeader);

  if(bearerToken) {
    log.info('Using bearer token:', bearerToken);
    req.set('Authorization', `Bearer ${bearerToken}`);
  }

  req.end((err, apiResponse) => handleResponse(res, err, apiResponse));
};

const handleResponse = (res, err, apiResponse) => {
  if (err || !apiResponse.ok) {
    log.error('Handling error response: ', err);
    res.send(err);
  } else {
    res.send(apiResponse.body);
  }
};

function str(token){
  return `[A:${token.access_token} R:${token.refresh_token} X:${token.expires_at}]`;
}


app.listen(appPort,() => {
  log.info(`Started at http://localhost:${appPort}`);
});