const expect = require('chai').expect;
const prepReturn = require('../../vat-return/prepReturn');

describe('vat-return.prepReturn()', function () {
  it('should return JSON containing 3 objects contianing 11, 6 and 7 ', async function () {

    let data = await prepReturn();

    console.log(data);
    expect(Object.keys(data.submitted).length).to.be.equal(11);
    expect(Object.keys(data.due).length).to.be.equal(6);
    expect(Object.keys(data.declare).length).to.be.equal(7);

  });
});


