const data = require('../data/index');
const sqlQueries = require('./sql-queries');
const timeIt = require('../utilities/timer');
require('dotenv').config();

const getTrialReturn = (month, year) => {

  return new Promise(async (resolve, reject) => {

    let totalECSalesToDateP;
    let totalECPurchasesToDateP;
    let netPurchasesToDateP;
    let netSalesToDateP;
    let totalInputVATToDateP;
    let totalOutputVATToDateP;
    let totalInputVATToDate;
    let totalOutputVATToDate;
    let netSalesToDate;
    let totalECSalesToDate;
    let totalECPurchasesToDate;
    let netPurchasesToDate;
    let fromStart = Date.now();
    let qEnd;
    let totalSubmitted;

    try {
      console.log('start select from vathistory');

      totalSubmitted = await data.sqPl.query(
        sqlQueries.totalSubmittedSql,
        {type: data.Sequelize.QueryTypes.SELECT});

      timeIt(fromStart);

      year = year || totalSubmitted[0]['NextEndYear'];
      month = month || totalSubmitted[0]['NextEndMonth'];

      if (!totalSubmitted.length) reject(new Error('No data returned'));
      if (!year) reject(new Error('Year not found or passed'));
      if (!month) reject(new Error('Month not found or passed'));

      qEnd = `${year}-${month}-31`;

      console.log('Preparing return values for ' + qEnd);
    }
    catch (e) {
      reject(e);
    }
    finally {
      console.log('end select from vathistory');
    }

    try {
      console.log('start gathering VAT data');

      totalOutputVATToDateP = data.sqAdmin.query(
        sqlQueries.totalOutputVATToDate,
        {replacements: [qEnd], type: data.Sequelize.QueryTypes.SELECT});

      timeIt(fromStart);

      totalInputVATToDateP = data.sqPl.query(
        sqlQueries.totalInputVATToDate,
        {replacements: [qEnd], type: data.Sequelize.QueryTypes.SELECT});

      timeIt(fromStart);

      netSalesToDateP = data.sqAdmin.query(
        sqlQueries.netSalesToDate,
        {replacements: [qEnd], type: data.Sequelize.QueryTypes.SELECT});

      timeIt(fromStart);

      netPurchasesToDateP = data.sqPl.query(
        sqlQueries.netPurchasesToDate,
        {replacements: [qEnd], type: data.Sequelize.QueryTypes.SELECT});

      timeIt(fromStart);

      totalECPurchasesToDateP = data.sqPl.query(
        sqlQueries.totalECPurchasesToDate,
        {replacements: [qEnd], type: data.Sequelize.QueryTypes.SELECT});

      timeIt(fromStart);

      totalECSalesToDateP = data.sqAdmin.query(
        sqlQueries.totalECSalesToDate,
        {replacements: [qEnd], type: data.Sequelize.QueryTypes.SELECT});

      timeIt(fromStart);

      totalInputVATToDate = await totalInputVATToDateP;
      totalOutputVATToDate = await totalOutputVATToDateP;
      netSalesToDate = await netSalesToDateP;
      netPurchasesToDate = await netPurchasesToDateP;
      totalECPurchasesToDate = await totalECPurchasesToDateP;
      totalECSalesToDate = await totalECSalesToDateP;
    }
    catch (e) {
      reject(e);
    }
    finally {
      console.log('end gathering VAT data');
    }

    let trialJson = {
      //grossSales: gross,
      submitted: totalSubmitted[0],
      due: {
        InputTotals: netPurchasesToDate[0].total,
        OutputTotals: netSalesToDate[0].total - totalOutputVATToDate[0].value,
        InputVAT: totalInputVATToDate[0]['inputVAT'],
        OutputVAT: totalOutputVATToDate[0].value,
        ECPurchases: totalECPurchasesToDate[0]['ecPurchases'],
        ECSales: totalECSalesToDate[0]['ecSales']
      },
      declare: {
        Inputs: Math.round(
          netPurchasesToDate[0].total -
          totalSubmitted[0]['InputTotals']),
        Outputs: Math.round(
          netSalesToDate[0].total -
          totalOutputVATToDate[0].value -
          totalSubmitted[0].OutputTotals),
        InputVAT: (
          totalInputVATToDate[0]['inputVAT'] -
          totalSubmitted[0].InputVAT
        ).toFixed(2),
        OutputVAT: (
          totalOutputVATToDate[0].value -
          totalSubmitted[0].OutputVAT
        ).toFixed(2),
        VATPayable: (
          (totalOutputVATToDate[0].value - totalSubmitted[0].OutputVAT) -
          (totalInputVATToDate[0]['inputVAT'] - totalSubmitted[0].InputVAT)
        ).toFixed(2),
        ECPurchases: Math.round(
          totalECPurchasesToDate[0]['ecPurchases'] -
          totalSubmitted[0].ECPurchases
        ) || 0,
        ECSales: Math.round(
          totalECSalesToDate[0]['ecSales'] -
          totalSubmitted[0].ECSales
        ) || 0
      }
    };

    timeIt(fromStart);

    resolve(trialJson);

  });

};

module.exports = getTrialReturn;
