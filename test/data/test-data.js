const expect = require('chai').expect;
const data = require('../../data/index');

describe('data.sqAdmin.authenticate()', function () {
  it('connection to sqAdmin should not error', function () {

    data.sqAdmin.authenticate().then(() => {
      console.log('sqPl connection has been established successfully.');
      expect(true);

    }).catch(err => {
      console.error('Unable to connect to the sqPl database:', err);
      expect(false);
    });

  });
});

describe('data.sqPl.authenticate()', function () {
  it('connection to sqPl should not error', function () {

    data.sqPl.authenticate().then(() => {
      console.log('sqPl connection has been established successfully.');
      expect(true);

    }).catch(err => {
      console.error('Unable to connect to the sqPl database:', err);
      expect(false);
    });

  });
});

