require('dotenv').config();

const auth = require('./authenticate');
const winston = require('winston');
const superAgent = require('superagent');

const oauth2 = auth.oauth2;
const oauthScope = 'read:vat write:vat';

const log = winston.createLogger({
  transports: [
    new winston.transports.Console()
  ]
});

const callApi = (resource, res, bearerToken, req, redir, respCallback) => {
  const acceptHeader = `application/vnd.hmrc.${process.env.HMRC_API_SERVICE_VERSION}+json`;
  const url = process.env.HMRC_API_BASE_URL + process.env.HMRC_API_VAT_SERVICE_NAME + resource;
  log.info(`Calling ${url} with Accept: ${acceptHeader}`);
  const sReq = superAgent
    .get(url)
    .accept(acceptHeader);

  if(bearerToken) {
    log.info('Using bearer token:', bearerToken);
    sReq.set('Authorization', `Bearer ${bearerToken}`);
  }

  sReq.end((err, apiResponse) => respCallback(res, err, apiResponse, req, redir));
};

const authenticate = (req, res, userRestrictedEndpoint, authorizationUri, redir, callback) => {
  if(req.session.oauth2Token){
    var accessToken = oauth2.accessToken.create(req.session.oauth2Token);

    if(accessToken.expired()){
      log.info('Token expired: ', accessToken.token);
      accessToken.refresh()
        .then((result) => {
          log.info('Refreshed token: ', result.token);
          req.session.oauth2Token = result.token;
          callApi(userRestrictedEndpoint, res, result.token.access_token, req, redir, callback);
        })
        .catch((error) => {
          log.error('Error refreshing token: ', error);
          res.send(error);
        });
    } else {
      log.info('Using token from session: ', accessToken.token);
      callApi(userRestrictedEndpoint, res, accessToken.token.access_token, req, redir, callback);
    }
  } else {
    log.info('Need to request token')
    req.session.caller = '/login';
    res.redirect(authorizationUri);
  }
}

const authCallback = (req, res, redirectUri) => {
  const options = {
    redirect_uri: redirectUri,
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
    res.redirect('/login');
  });
}

module.exports = {
  authenticate: authenticate,
  authCallback: authCallback
}
