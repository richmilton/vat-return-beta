/*



 */

require('dotenv').config();

const auth = require('./authenticate');
const winston = require('winston');
const superAgent = require('superagent');

//TODO - upgrade to latest simple-oauth2
const oauth2 = auth.oauth2;

const log = winston.createLogger({
  transports: [
    new winston.transports.Console()
  ]
});

const callApi = (resource, res, bearerToken, req, options) => {
  const acceptHeader = `application/vnd.hmrc.${process.env.HMRC_API_SERVICE_VERSION}+json`;
  const url = process.env.HMRC_API_BASE_URL + process.env.HMRC_API_VAT_SERVICE_NAME + resource;
  log.info(`Calling ${url} with Accept: ${acceptHeader}`);
  let sReq;
  if (options.method === 'post') {
    sReq = superAgent
      .post(url)
      .accept(acceptHeader)
      .send(options.reqBody);
  }
  else {
    sReq = superAgent
      .get(url)
      .accept(acceptHeader);
  }

  if(bearerToken) {
    log.info('Using bearer token:', bearerToken);
    sReq.set('Authorization', `Bearer ${bearerToken}`);
  }

  sReq.end((err, apiResponse) => options.appCallBackHandler(res, err, apiResponse, req, options.appRespHandlerRedirectPath));
};

const authenticate = (req, res, options) => { //userRestrictedEndpoint, returnUri, redir, returnTo, callback
  const authorizationUri = oauth2.authorizationCode.authorizeURL({
    redirect_uri: options.appAuthCallbackPath,
    response_type: 'code',
    scope: process.env.HMRC_API_SCOPE,
  });

  //if there's a token in the session get it
  if(req.session.oauth2Token){
    let accessToken = oauth2.accessToken.create(req.session.oauth2Token);

    //if the sessio token has expired refresh it
    if(accessToken.expired()){
      log.info('Token expired: ', accessToken.token);
      accessToken.refresh()
        .then((result) => {
          log.info('Refreshed token: ', result.token);
          req.session.oauth2Token = result.token;
          callApi(
            options.hmrcEndpoint,
            res, result.token['access_token'],
            req,
            options
          );
        })
        .catch((error) => {
          log.error('Error refreshing token: ', error);
          res.send(error);
        });
    } else {
      //session token not expired
      log.info('Using token from session: ', accessToken.token);
      callApi(
        options.hmrcEndpoint,
        res,
        accessToken.token['access_token'],
        req,
        options
      );
    }
  } else {
    // no freakin token
    log.info('Need to request token');
    req.session.caller = options.appRespHandlerRedirectPath; //'/login?vrn=' + req.session.vrn || '' ;
    res.redirect(authorizationUri);
  }
};

const authCallback = (req, res, returnUri, returnTo) => {
  const options = {
    redirect_uri: returnUri,
    code: req.query.code
  };
  log.info(options);

  oauth2.authorizationCode.getToken(options, (error, result) => {
    if (error) {
      log.error('Access Token Error: ', error);
      return res.json('Authentication failed');
    }

    log.info('Got token: ', result);
    // save token on session and return to calling page
    req.session.oauth2Token = result;
    res.redirect(returnTo);//'/login?vrn=' + req.session.vrn || '');
  });
};

module.exports = {
  authenticate: authenticate,
  authCallback: authCallback
};
