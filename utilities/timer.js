require('dotenv').config();

module.exports = (startTime) => {if (/^true$|^yes$/.test(process.env.TIMER)) console.log(Date.now() - startTime)};
