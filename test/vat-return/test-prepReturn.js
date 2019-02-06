const expect = require('chai').expect;
const prepReturn = require('../../vat-return/prepReturn');

describe('vat-return.prepReturn()', function () {
  it('should not error', function () {

    let res = prepReturn();
    res.then(data => console.log(data))

  });
});


