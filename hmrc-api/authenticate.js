require('dotenv').config();

const simpleOauthModule = require('simple-oauth2');

const apiBaseUrl = process.env.HMRC_API_BASE_URL;

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

let auth = {
  oauth2,
};

module.exports = auth;
