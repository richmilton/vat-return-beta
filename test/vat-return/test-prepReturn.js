const expect = require('chai').expect;
const prepReturn = require('../../vat-return/prepReturn');
const postReturn = require('../../vat-return/postReturn');

const timeout = 10000;

describe('vat-return.prepReturn()', function () {
  this.timeout(timeout)
  it('should return JSON containing 3 objects containing 11, 6 and 7 properties', async function () {

    let data = await prepReturn();

    console.log(data);
    expect(Object.keys(data).length).to.be.equal(3);
    expect(Object.keys(data['submitted']).length).to.be.equal(10);
    expect(Object.keys(data['due']).length).to.be.equal(6);
    expect(Object.keys(data['declare']).length).to.be.equal(9);

  });
});

describe('vat-return.postReturn()', function () {
  this.timeout(timeout)
  it('should return JSON containing 31 objects containing 11 properties', async function () {

    let data = await postReturn();

    console.log(data);
    expect(Object.keys(data['hmrcValues']).length).to.be.equal(11);

  });
});
