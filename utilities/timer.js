require('dotenv').config();

module.exports = (startTime) => {if (process.env.TIMER) console.log(Date.now() - startTime)};
