const expect = require('chai').expect;
const data = require('../../data/index');

describe('data.sqAdmin.authenticate()', function () {
  it('should not error', function () {

    let sql = "SELECT sum(PurchaseAmount) as total FROM `ordertable` where invoicedate >= ? and invoicedate <= ?";

    data.sqAdmin.query(sql, { replacements: ['2010-10-01', '2011-09-30'],type: data.Sequelize.QueryTypes.SELECT})
      .then(result => {
        console.log(result);
        expect(result[0].total).to.be.equal('11105215');
      }).catch(err => console.log(err));

  });
});


