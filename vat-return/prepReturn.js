const data = require('../data/index');
const dateFormat = require('dateformat');

const getTrialReturn = (month, year) => {

  return new Promise(async (resolve, reject) => {
    let now = Date.now();
    const timeIt = (startTime) => console.log(Date.now() - startTime);

    let totalSubmittedSql = "SELECT " +
      "month(date_add(max(EndDate), interval 3 month)) as NextEndMonth, " +
      "year(date_add(max(EndDate), interval 3 month)) as NextEndYear, " +
      "if(now()<date_add(max(EndDate), interval 3 month),0,1) as CanBeSubmitted, " +
      "date_add(max(EndDate), interval 1 day) as NextVATPeriodBegin, " +
      "date_add(max(EndDate), interval 3 month) as NextVATPeriodEnd, " +
      "sum(Inputs) as InputTotals, sum(Outputs) as OutputTotals, " +
      "sum(InputVAT) as InputVAT, sum(OutputVAT) as OutputVAT, " +
      "sum(ECPurchases) as ECPurchases, sum(ECSales) as ECSales " +
      "FROM vathistory where Status='Actual'";
    let totalSubmitted = await data.sqPl.query(totalSubmittedSql, { type: data.Sequelize.QueryTypes.SELECT});
    timeIt(now);

    let qEnd = `${year || totalSubmitted[0].NextEndYear}-${month || totalSubmitted[0].NextEndMonth}-31`;

    let sql = "SELECT " +
      "sum((PurchaseAmount/100)-(PurchaseAmount/100/(1+(VatRate/10000)))) as 'value' " +
      "FROM ordertable o where InvoiceDate <= ? and VatRate>0";
    let totalOutputVATToDateP = data.sqAdmin.query(sql, {replacements: [qEnd], type: data.Sequelize.QueryTypes.SELECT});
    timeIt(now);

    sql = "SELECT " +
      "round(sum(NetAmount/100*TaxRate/100))/100 as inputVAT " +
      "FROM invoice_item j inner join invoice i on i.InvoiceId=j.InvoiceId where InvoiceDate <= ?";
    let totalInputVATToDateP = data.sqPl.query(sql, {replacements: [qEnd],  type: data.Sequelize.QueryTypes.SELECT});
    timeIt(now);

    sql = "SELECT " +
      "if(sum(if(PurchaseCurrency=978,round(PurchaseAmount*Rate),PurchaseAmount)/100) is null, 0, sum(if(PurchaseCurrency=978,round(PurchaseAmount*Rate),PurchaseAmount)/100)) as total " +
      "FROM ordertable o inner join exchange_rates on month(MonthStart)=month(InvoiceDate) and year(MonthStart)=year(InvoiceDate) " +
      "where CpiResultsCode in (0,100) and InvoiceDate >= '2007-01-01' and InvoiceDate <= ?";
    let netSalesToDateP = data.sqAdmin.query(sql, {replacements: [qEnd], type: data.Sequelize.QueryTypes.SELECT});
    timeIt(now);

    sql = "SELECT " +
      "if(sum(if(CurrencyId=978,(round(NetAmount*Rate*10)/1000),NetAmount/100)) is null, 0, sum(if(CurrencyId=978,(round(NetAmount*Rate*10)/1000),NetAmount/100))) as total " +
      "FROM invoice j inner join exchange_rates on month(MonthStart)=month(InvoiceDate) and year(MonthStart)=year(InvoiceDate) " +
      "inner join invoice_item i on i.InvoiceId=j.InvoiceId where InvoiceDate <= ?";
    let netPurchasesToDateP = data.sqPl.query(sql, {replacements: [qEnd], type: data.Sequelize.QueryTypes.SELECT});
    timeIt(now);

    sql = "SELECT if(sum(if(j.CurrencyId=978,(round(if(NetAmount*Rate is null,0,NetAmount*Rate)*10)/1000),NetAmount/100)) is null,0,sum(if(j.CurrencyId=978,(round(if(NetAmount*Rate is null,0,NetAmount*Rate)*10)/1000),NetAmount/100))) as ecPurchases " +
      "FROM invoice_item i inner join invoice j on i.InvoiceId=j.InvoiceId " +
      "inner join exchange_rates e on month(MonthStart)=month(InvoiceDate) and year(MonthStart)=year(InvoiceDate) " +
      "inner join organisation o on o.OrganisationId=j.SupplierId where CountryCode<>826 and InvoiceDate <= ?";
    let totalECPurchasesToDateP = data.sqPl.query(sql, {replacements: [qEnd], type: data.Sequelize.QueryTypes.SELECT});
    timeIt(now);

    sql = "SELECT sum(if(PurchaseCurrency=978,round(PurchaseAmount*Rate),PurchaseAmount)/100) as ecSales " +
      "FROM ordertable o inner join retailers r on Retailer_id=o.RetailerId " +
      "inner join exchange_rates on month(MonthStart)=month(InvoiceDate) and year(MonthStart)=year(InvoiceDate) " +
      "inner join address a on r.Retailer_Id=a.RetailerId where CpiResultsCode in (0,100) and InvoiceDate >= '2007-01-01' and InvoiceDate <= ? and Country<>'826'";
    let totalECSalesToDateP = data.sqAdmin.query(sql, {replacements: [qEnd], type: data.Sequelize.QueryTypes.SELECT});
    timeIt(now);

    let totalInputVATToDate = await totalInputVATToDateP;
    let totalOutputVATToDate = await totalOutputVATToDateP;
    let netSalesToDate = await netSalesToDateP;
    let netPurchasesToDate = await netPurchasesToDateP;
    let totalECPurchasesToDate = await totalECPurchasesToDateP;
    let totalECSalesToDate = await totalECSalesToDateP;

    let trialJson = {
      //grossSales: gross,
      submitted: totalSubmitted[0],
      due: {
        InputTotals: netPurchasesToDate[0].total,
        OutputTotals: netSalesToDate[0].total - totalOutputVATToDate[0].value,
        InputVAT: totalInputVATToDate[0].inputVAT,
        OutputVAT: totalOutputVATToDate[0].value,
        ECPurchases: totalECPurchasesToDate[0].ecPurchases,
        ECSales: totalECSalesToDate[0].ecSales
      },
      declare: {
        Inputs: Math.round(netPurchasesToDate[0].total - totalSubmitted[0].InputTotals),
        Outputs: Math.round(netSalesToDate[0].total - totalOutputVATToDate[0].value - totalSubmitted[0].OutputTotals),
        InputVAT: (totalInputVATToDate[0].inputVAT - totalSubmitted[0].InputVAT).toFixed(2),
        OutputVAT: (totalOutputVATToDate[0].value - totalSubmitted[0].OutputVAT).toFixed(2),
        VATPayable: ((totalOutputVATToDate[0].value - totalSubmitted[0].OutputVAT) - (totalInputVATToDate[0].inputVAT - totalSubmitted[0].InputVAT)).toFixed(2),
        ECPurchases: Math.round(totalECPurchasesToDate[0].ecPurchases - totalSubmitted[0].ECPurchases) || 0,
        ECSales: Math.round(totalECSalesToDate[0].ecSales - totalSubmitted[0].ECSales) || 0
      }
    }

    console.log(Date.now() - now);

    resolve(trialJson);

  });

}

module.exports = getTrialReturn;
