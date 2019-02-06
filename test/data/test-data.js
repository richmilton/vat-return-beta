const expect = require('chai').expect;
const data = require('../../data/index');

describe('data.sqAdmin.authenticate()', function () {
  it('should not error', function () {

    data.sqAdmin.query("SELECT sum(PurchaseAmount) as total FROM `ordertable`", {type: data.Sequelize.QueryTypes.SELECT})
      .then(total => {
        console.log(total);
        // We don't need spread here, since only the results will be returned for select queries
      })

  });
});

describe('data.sqPl.authenticate()', function () {
  it('should not error', function () {

    data.sqPl.authenticate().then(() => {
      console.log('sqPl connection has been established successfully.');

      expect(true);
    })
      .catch(err => {
        console.error('Unable to connect to the sqPl database:', err);
        expect(false);
      });

  });
});

