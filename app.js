require('dotenv').config();

const express = require('express');
const winston = require('winston');
const cookieSession = require('cookie-session');

const prepReturn = require('./vat-return/prepReturn');
const postReturn = require('./vat-return/postReturn');
const endpointCallbacks = require('./hmrc-api/endpoints');

const log = winston.createLogger({
  transports: [
    new winston.transports.Console()
  ]
});

const appPort = process.env.APP_PORT;
const authCallbackPath = '/auth/callback';
const loginPath = '/login';
const returnUri = `http://localhost:${appPort}${authCallbackPath}`;
//const userRestrictedEndpoint = `/${process.env.HMRC_API_VRN}/obligations?from=2018-01-01&to=2018-12-31`;
const docRootPath = '/';

const handleResponse = (res, err, apiResponse, req, redir) => {
  let dataItem;
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
      res.redirect(redir);
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

app.get(docRootPath, (req, res) => {
  log.debug(req.session);

  //get obligations

  res.render('index', {
    loggedIn: req.session.oauth2Token || false,
    data: req.session['data']
  });
});

app.get(loginPath, (req, res) => {
  let endpoint = `/${req.query.vrn}/obligations?from=2018-01-01&to=2018-12-31`;
  req.session.returnto = '/login?vrn=' + req.query.vrn;
  req.session.vrn = req.query.vrn;
    return endpointCallbacks.authenticate(
      req,
      res,
      {
        hmrcEndpoint: endpoint,                                 //hmrc api endpoint
        appAuthCallbackPath: returnUri,                         //auth callback path
        appRespHandlerRedirectPath: docRootPath,                //final destination
        appEndpointPath: `${loginPath}?vrn=${req.query.vrn}`,   //endpoint callback path
        appCallBackHandler: handleResponse                      //response handler
    });
  }
);

app.get(authCallbackPath, (req, res) => endpointCallbacks.authCallback(req, res, returnUri, req.session.returnto));

app.get("/logout", (req, res) => {
  req.session = null;
  res.redirect(docRootPath);
});

app.get("/prepReturn", async (req, res) => {
  let returnData = await prepReturn();
  if (req.session.data) {
    req.session.data['returnData'] = returnData;
  }
  res.redirect(docRootPath);
});

app.get('/submit-return', async (req, res) => {
  const periodKey = req.query['periodKey'];
  const vrn = req.session.vrn;
  let endpoint = `/${vrn}/returns`;
  let submitData = await postReturn(periodKey);
  return endpointCallbacks.authenticate(
    req,
    res,
    {
      hmrcEndpoint: endpoint,                                 //hmrc api endpoint
      appAuthCallbackPath: returnUri,                         //auth callback path
      appEndpointPath: `${loginPath}?vrn=${req.query.vrn}`,   //endpoint callback path
      appCallBackHandler: handleResponse,                      //response handler
      reqBody: submitData['hmrcValues'],
      method: 'post'
    });
});

app.get('/view-return', (req, res) => {
  const periodKey = req.query['periodKey'];
  const vrn = req.session.vrn;
  let endpoint = `/${vrn}/returns/${periodKey}`;
  return endpointCallbacks.authenticate(
    req,
    res,
    {
      hmrcEndpoint: endpoint,                                 //hmrc api endpoint
      appAuthCallbackPath: returnUri,                         //auth callback path
    });
});

app.listen(appPort,() => {
  log.info(`Started at http://localhost:${appPort}`);
});