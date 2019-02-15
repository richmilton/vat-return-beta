const expect = require('chai').expect;
const prepReturn = require('../../vat-return/prepReturn');
const postReturn = require('../../vat-return/postReturn');

describe('vat-return.prepReturn()', function () {
  it('should return JSON containing 3 objects containing 11, 6 and 7 properties', async function () {

    let data = await prepReturn();

    console.log(data);
    expect(Object.keys(data).length).to.be.equal(3);
    expect(Object.keys(data['submitted']).length).to.be.equal(11);
    expect(Object.keys(data['due']).length).to.be.equal(6);
    expect(Object.keys(data['declare']).length).to.be.equal(7);

  });
});

describe('vat-return.postReturn()', function () {
  it('should return JSON containing 31 objects containing 11 properties', async function () {

    let data = await postReturn();

    console.log(data);
    expect(Object.keys(data['hmrcValues']).length).to.be.equal(11);

  });
});
