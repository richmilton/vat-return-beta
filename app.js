require('dotenv').config();

const express = require('express');
const winston = require('winston');
const log = winston.createLogger({
  transports: [
    new winston.transports.Console()
  ]
});

const serviceVersion = '1.0';

//TODO - upgrade to latest simple-oauth2
const simpleOauthModule = require('simple-oauth2');

const appPort = process.env.APP_PORT;
const oauthScope = 'read:vat write:vat';

const cookieSession = require('cookie-session');
const redirectUri = `http://localhost:${appPort}/auth/callback`;
const userRestrictedEndpoint = '/666679046/obligations?from=2018-01-01&to=2018-12-31'
const apiBaseUrl = process.env.HMRC_API_BASE_URL;
const serviceName = 'organisations/vat';
const superAgent = require('superagent');
const prepReturn = require('./vat-return/prepReturn');
const endpointCallbacks = require('./hmrc-api/endpoints');

const oauth2 = simpleOauthModule.create({
  client: {
    id: process.env.HMRC_API_CLIENT_ID,
    secret: process.env.HMRC_API_CLIENT_SECRET,
  },
  auth: {
    tokenHost: apiBaseUrl,
    tokenPath: '/oauth/token',
    authorizePath: '/oauth/authorize',
  },
});

const authorizationUri = oauth2.authorizationCode.authorizeURL({
  redirect_uri: redirectUri,
  response_type: 'code',
  scope: oauthScope,
});

const callApi = (resource, res, bearerToken, req, redir) => {
  const acceptHeader = `application/vnd.hmrc.${serviceVersion}+json`;
  const url = apiBaseUrl + serviceName + resource;
  log.info(`Calling ${url} with Accept: ${acceptHeader}`);
  const sReq = superAgent
    .get(url)
    .accept(acceptHeader);

  if(bearerToken) {
    log.info('Using bearer token:', bearerToken);
    sReq.set('Authorization', `Bearer ${bearerToken}`);
  }

  sReq.end((err, apiResponse) => handleResponse(res, err, apiResponse, req, redir));
};

const handleResponse = (res, err, apiResponse, req, redir) => {
  if (err || !apiResponse.ok) {
    log.error('Handling error response: ', err);
    res.send(err);
  } else {
    dataItem = apiResponse.body;
    for (let key in dataItem) {
      req.session.data = {};
      req.session.data[key] = dataItem[key];
    }

    if (redir) {
      res.redirect('/');
    }
    else {
      res.send(apiResponse.body);
    }
  }
};

const app = express();

app.use(cookieSession({
  name: 'session',
  keys: ['oauth2Token', 'caller'],
  maxAge: 10 * 60 * 60 * 1000 // 10 hours
}));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  log.debug(req.session);

  //get obligations

  res.render('index', {
    loggedIn: req.session.oauth2Token || false,
    data: req.session['data']
  });
});

app.get("/login",(req,res) => {
    return endpointCallbacks.authenticate(
      req,
      res,
      userRestrictedEndpoint,
      authorizationUri,
      '/',
      handleResponse);
  }
);

app.get('/auth/callback', (req, res) => endpointCallbacks.authCallback(req, res, redirectUri));

app.get("/logout", (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.get("/prepReturn", async (req, res) => {
  let returnData = await prepReturn();
  if (req.session.data) {
    req.session.data['returnData'] = returnData;
  }
  res.redirect('/');
});

function str(token){
  return `[A:${token.access_token} R:${token.refresh_token} X:${token.expires_at}]`;
}


app.listen(appPort,() => {
  log.info(`Started at http://localhost:${appPort}`);
});