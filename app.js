require('dotenv').config();

const express = require('express');
const winston = require('winston');
const cookieSession = require('cookie-session');

const prepReturn = require('./vat-return/prepReturn');
const endpointCallbacks = require('./hmrc-api/endpoints');

const log = winston.createLogger({
  transports: [
    new winston.transports.Console()
  ]
});

const appPort = process.env.APP_PORT;
const returnUri = `http://localhost:${appPort}/auth/callback`;
//const userRestrictedEndpoint = `/${process.env.HMRC_API_VRN}/obligations?from=2018-01-01&to=2018-12-31`;
const docRoot = '/';

const handleResponse = (res, err, apiResponse, req, redir) => {
  if (err || !apiResponse.ok) {
    log.error('Handling error response: ', err);
    res.send(err);
  } else {
    dataItem = apiResponse.body;
    log.info(dataItem);
    for (let key in dataItem) {
      req.session.data = {};
      req.session.data[key] = dataItem[key];
    }

    if (redir) {
      res.redirect(docRoot);
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

app.get(docRoot, (req, res) => {
  log.debug(req.session);

  //get obligations

  res.render('index', {
    loggedIn: req.session.oauth2Token || false,
    data: req.session['data']
  });
});

app.get("/login",(req,res) => {
  let endpoint = `/${req.query.vrn}/obligations?from=2018-01-01&to=2018-12-31`;
  req.session.returnto = '/login?vrn=' + req.query.vrn;
    return endpointCallbacks.authenticate(
      req,
      res,
      endpoint,
      returnUri,
      docRoot,
      '/login?vrn=' + req.query.vrn,
      handleResponse);
  }
);

app.get('/auth/callback', (req, res) => endpointCallbacks.authCallback(req, res, returnUri, req.session.returnto));

app.get("/logout", (req, res) => {
  req.session = null;
  res.redirect(docRoot);
});

app.get("/prepReturn", async (req, res) => {
  let returnData = await prepReturn();
  if (req.session.data) {
    req.session.data['returnData'] = returnData;
  }
  res.redirect(docRoot);
});

app.listen(appPort,() => {
  log.info(`Started at http://localhost:${appPort}`);
});