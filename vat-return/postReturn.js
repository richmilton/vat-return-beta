const prepReturn = require('./prepReturn');

//get prep return

//post values to api, insert data into VatHistory if successful

const postReturn = (periodKey) => {
  return new Promise(async (resolve, reject) => {
    let values = await prepReturn();
    let decValues = values['declare'];

    if(!decValues) reject({error: 'no values found'});
    if(!values.submitted.CanBeSubmitted) reject({error: 'vat period not closed'});

    resolve ({
      canBeSubmitted: values.submitted['CanBeSubmitted'],
      qBegin: decValues.QStart,
      qEnd: decValues.QEnd,
      hmrcValues: {
        "periodKey": periodKey,
        "vatDueSales": decValues.OutputVAT,
        "vatDueAcquisitions": 0.00,
        "totalVatDue": decValues.OutputVAT,
        "vatReclaimedCurrPeriod": decValues.InputVAT,
        "netVatDue": decValues.VATPayable,
        "totalValueSalesExVAT": decValues.Outputs,
        "totalValuePurchasesExVAT": decValues.Inputs,
        "totalValueGoodsSuppliedExVAT": decValues.ECSales,
        "totalAcquisitionsExVAT": decValues.ECPurchases,
        "finalised": true
      }
    })
  })

};

module.exports = postReturn;
