const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

describe('Functional Tests', function() {

  // Test variables to store data between tests
  let testStock1 = 'GOOG';
  let testStock2 = 'MSFT';
  let likesBeforeTest3;

  describe('GET /api/stock-prices', function() {

    it('1. Viewing one stock', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: testStock1 })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body, 'response should be an object');
          assert.property(res.body, 'stockData', 'response should have stockData property');
          assert.equal(res.body.stockData.stock, testStock1);
          assert.property(res.body.stockData, 'price');
          assert.property(res.body.stockData, 'likes');
          assert.isNumber(res.body.stockData.price);
          assert.isNumber(res.body.stockData.likes);
          done();
        });
    });

    it('2. Viewing one stock and liking it', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: testStock1, like: 'true' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, testStock1);
          assert.isAtLeast(res.body.stockData.likes, 1);
          // Store likes count for the next test
          likesBeforeTest3 = res.body.stockData.likes;
          done();
        });
    });

    it('3. Viewing the same stock and liking it again', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: testStock1, like: 'true' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, testStock1);
          assert.equal(res.body.stockData.likes, likesBeforeTest3, 'likes should not increase');
          done();
        });
    });

    it('4. Viewing two stocks', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: [testStock1, testStock2] })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body.stockData);
          assert.equal(res.body.stockData.length, 2);
          assert.property(res.body.stockData[0], 'rel_likes');
          assert.property(res.body.stockData[1], 'rel_likes');
          assert.equal(res.body.stockData[0].rel_likes, -res.body.stockData[1].rel_likes);
          done();
        });
    });

    it('5. Viewing two stocks and liking them', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: [testStock1, testStock2], like: 'true' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body.stockData);
          assert.equal(res.body.stockData.length, 2);
          assert.property(res.body.stockData[0], 'rel_likes');
          assert.property(res.body.stockData[1], 'rel_likes');
          assert.equal(res.body.stockData[0].rel_likes, -res.body.stockData[1].rel_likes);
          done();
        });
    });

  });

});
