module.exports = {

  totalSubmittedSql: "SELECT " +
  "month(date_add(max(EndDate), interval 3 month)) as NextEndMonth, " +
  "year(date_add(max(EndDate), interval 3 month)) as NextEndYear, " +
  "if(now()<date_add(max(EndDate), interval 3 month),0,1) as CanBeSubmitted, " +
  "date_add(max(EndDate), interval 1 day) as NextVATPeriodBegin, " +
  "date_add(max(EndDate), interval 3 month) as NextVATPeriodEnd, " +
  "sum(Inputs) as InputTotals, sum(Outputs) as OutputTotals, " +
  "sum(InputVAT) as InputVAT, sum(OutputVAT) as OutputVAT, " +
  "sum(ECPurchases) as ECPurchases, sum(ECSales) as ECSales " +
  "FROM vathistory where Status='Actual'",

  totalOutputVATToDate: "SELECT " +
  "sum((PurchaseAmount/100)-(PurchaseAmount/100/(1+(VatRate/10000)))) as 'value' " +
  "FROM ordertable o where InvoiceDate <= ? and VatRate>0",

  totalInputVATToDate: "SELECT " +
  "round(sum(NetAmount/100*TaxRate/100))/100 as inputVAT " +
  "FROM invoice_item j inner join invoice i on i.InvoiceId=j.InvoiceId where InvoiceDate <= ?",

  netSalesToDate: "SELECT " +
  "if(sum(if(PurchaseCurrency=978,round(PurchaseAmount*Rate),PurchaseAmount)/100) is null, 0, sum(if(PurchaseCurrency=978,round(PurchaseAmount*Rate),PurchaseAmount)/100)) as total " +
  "FROM ordertable o inner join exchange_rates on month(MonthStart)=month(InvoiceDate) and year(MonthStart)=year(InvoiceDate) " +
  "where CpiResultsCode in (0,100) and InvoiceDate >= '2007-01-01' and InvoiceDate <= ?",

  netPurchasesToDate: "SELECT " +
  "if(sum(if(CurrencyId=978,(round(NetAmount*Rate*10)/1000),NetAmount/100)) is null, 0, sum(if(CurrencyId=978,(round(NetAmount*Rate*10)/1000),NetAmount/100))) as total " +
  "FROM invoice j inner join exchange_rates on month(MonthStart)=month(InvoiceDate) and year(MonthStart)=year(InvoiceDate) " +
  "inner join invoice_item i on i.InvoiceId=j.InvoiceId where InvoiceDate <= ?",

  totalECPurchasesToDate: "SELECT if(sum(if(j.CurrencyId=978,(round(if(NetAmount*Rate is null,0,NetAmount*Rate)*10)/1000),NetAmount/100)) is null,0,sum(if(j.CurrencyId=978,(round(if(NetAmount*Rate is null,0,NetAmount*Rate)*10)/1000),NetAmount/100))) as ecPurchases " +
  "FROM invoice_item i inner join invoice j on i.InvoiceId=j.InvoiceId " +
  "inner join exchange_rates e on month(MonthStart)=month(InvoiceDate) and year(MonthStart)=year(InvoiceDate) " +
  "inner join organisation o on o.OrganisationId=j.SupplierId where CountryCode<>826 and InvoiceDate <= ?",

  totalECSalesToDate: "SELECT sum(if(PurchaseCurrency=978,round(PurchaseAmount*Rate),PurchaseAmount)/100) as ecSales " +
  "FROM ordertable o inner join retailers r on Retailer_id=o.RetailerId " +
  "inner join exchange_rates on month(MonthStart)=month(InvoiceDate) and year(MonthStart)=year(InvoiceDate) " +
  "inner join address a on r.Retailer_Id=a.RetailerId where CpiResultsCode in (0,100) and InvoiceDate >= '2007-01-01' and InvoiceDate <= ? and Country<>'826'"

};