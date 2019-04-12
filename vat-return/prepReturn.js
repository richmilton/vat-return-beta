const {
  Sequelize: { QueryTypes: { SELECT } },
  sqAdmin,
  sqPl,
} = require('../data/index');
const {
  totalECPurchasesToDate,
  totalECSalesToDate,
  totalInputVATToDate,
  totalOutputVATToDate,
  totalSubmittedSql,
  netPurchasesToDate,
  netSalesToDate,
} = require('./sql-queries');
const timeIt = require('../utilities/timer');

const getTrialReturn = (month, year) => {

  return new Promise(async (resolve, reject) => {

    let totalECSalesToDateP;
    let totalECPurchasesToDateP;
    let netPurchasesToDateP;
    let netSalesToDateP;
    let totalInputVATToDateP;
    let totalOutputVATToDateP;
    let totalInputVATToDateR;
    let totalOutputVATToDateR;
    let netSalesToDateR;
    let totalECSalesToDateR;
    let totalECPurchasesToDateR;
    let netPurchasesToDateR;
    let fromStart = Date.now();
    let qEnd;
    let totalSubmittedR;

    try {
      console.log('start select from vathistory', totalSubmittedSql, SELECT );

      totalSubmittedR = await sqPl.query(
        totalSubmittedSql,
        {type: SELECT});

      timeIt(fromStart);

      year = year || totalSubmittedR[0]['NextEndYear'];
      month = month || totalSubmittedR[0]['NextEndMonth'];

      if (!totalSubmittedR.length) reject(new Error('No data returned'));
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

      totalOutputVATToDateP = sqAdmin.query(
        totalOutputVATToDate,
        {replacements: [qEnd], type: SELECT});

      timeIt(fromStart);

      totalInputVATToDateP = sqPl.query(
        totalInputVATToDate,
        {replacements: [qEnd], type: SELECT});

      timeIt(fromStart);

      netSalesToDateP = sqAdmin.query(
        netSalesToDate,
        {replacements: [qEnd], type: SELECT});

      timeIt(fromStart);

      netPurchasesToDateP = sqPl.query(
        netPurchasesToDate,
        {replacements: [qEnd], type: SELECT});

      timeIt(fromStart);

      totalECPurchasesToDateP = sqPl.query(
        totalECPurchasesToDate,
        {replacements: [qEnd], type: SELECT});

      timeIt(fromStart);

      totalECSalesToDateP = sqAdmin.query(
        totalECSalesToDate,
        {replacements: [qEnd], type: SELECT});

      timeIt(fromStart);

      totalInputVATToDateR = await totalInputVATToDateP;
      totalOutputVATToDateR = await totalOutputVATToDateP;
      netSalesToDateR = await netSalesToDateP;
      netPurchasesToDateR = await netPurchasesToDateP;
      totalECPurchasesToDateR = await totalECPurchasesToDateP;
      totalECSalesToDateR = await totalECSalesToDateP;
    }
    catch (e) {
      reject(e);
    }
    finally {
      console.log('end gathering VAT data');
    }

    const trialJson = {
      //grossSales: gross,
      submitted: totalSubmittedR[0],
      due: {
        InputTotals: netPurchasesToDateR[0].total,
        OutputTotals: netSalesToDateR[0].total - totalOutputVATToDateR[0].value,
        InputVAT: totalInputVATToDateR[0]['inputVAT'],
        OutputVAT: totalOutputVATToDateR[0].value,
        ECPurchases: totalECPurchasesToDateR[0]['ecPurchases'],
        ECSales: totalECSalesToDateR[0]['ecSales']
      },
      declare: {
        Inputs: Math.round(
          netPurchasesToDateR[0].total -
          totalSubmittedR[0]['InputTotals']),

        Outputs: Math.round(
          netSalesToDateR[0].total -
          totalOutputVATToDateR[0].value -
          totalSubmittedR[0].OutputTotals),

        InputVAT: parseFloat((
          totalInputVATToDateR[0]['inputVAT'] -
          totalSubmittedR[0].InputVAT
        ).toFixed(2)),

        OutputVAT: parseFloat((
          totalOutputVATToDateR[0].value -
          totalSubmittedR[0].OutputVAT
        ).toFixed(2)),

        VATPayable: parseFloat((
          (totalOutputVATToDateR[0].value - totalSubmittedR[0].OutputVAT) -
          (totalInputVATToDateR[0]['inputVAT'] - totalSubmittedR[0].InputVAT)
        ).toFixed(2)),

        ECPurchases: Math.round(
          totalECPurchasesToDateR[0]['ecPurchases'] -
          totalSubmittedR[0].ECPurchases
        ) || 0,

        ECSales: Math.round(
          totalECSalesToDateR[0]['ecSales'] -
          totalSubmittedR[0].ECSales
        ) || 0

      }
    };

    timeIt(fromStart);

    resolve(trialJson);

  });

};

module.exports = getTrialReturn;
