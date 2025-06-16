const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  
  // Test variables to store data between tests
  let testStock1 = 'GOOG';
  let testStock2 = 'MSFT';
  let likesBeforeTest3;
  
  suite('GET /api/stock-prices => stockData object', function() {
    
    test('1 stock', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({stock: testStock1})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isObject(res.body, 'response should be an object');
          assert.property(res.body, 'stockData', 'response should have stockData property');
          assert.isObject(res.body.stockData, 'stockData should be an object');
          assert.property(res.body.stockData, 'stock', 'stockData should have stock property');
          assert.property(res.body.stockData, 'price', 'stockData should have price property');
          assert.property(res.body.stockData, 'likes', 'stockData should have likes property');
          assert.equal(res.body.stockData.stock, testStock1, 'stock symbol should match');
          assert.isNumber(res.body.stockData.price, 'price should be a number');
          assert.isNumber(res.body.stockData.likes, 'likes should be a number');
          done();
        });
    });
    
    test('1 stock with like', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({stock: testStock1, like: 'true'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isObject(res.body, 'response should be an object');
          assert.property(res.body, 'stockData', 'response should have stockData property');
          assert.isObject(res.body.stockData, 'stockData should be an object');
          assert.property(res.body.stockData, 'stock', 'stockData should have stock property');
          assert.property(res.body.stockData, 'price', 'stockData should have price property');
          assert.property(res.body.stockData, 'likes', 'stockData should have likes property');
          assert.equal(res.body.stockData.stock, testStock1, 'stock symbol should match');
          assert.isNumber(res.body.stockData.price, 'price should be a number');
          assert.isNumber(res.body.stockData.likes, 'likes should be a number');
          assert.isAtLeast(res.body.stockData.likes, 1, 'likes should be at least 1 after liking');
          
          // Store likes count for next test
          likesBeforeTest3 = res.body.stockData.likes;
          done();
        });
    });
    
    test('1 stock with like again (ensure likes do not increase)', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({stock: testStock1, like: 'true'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isObject(res.body, 'response should be an object');
          assert.property(res.body, 'stockData', 'response should have stockData property');
          assert.isObject(res.body.stockData, 'stockData should be an object');
          assert.property(res.body.stockData, 'stock', 'stockData should have stock property');
          assert.property(res.body.stockData, 'price', 'stockData should have price property');
          assert.property(res.body.stockData, 'likes', 'stockData should have likes property');
          assert.equal(res.body.stockData.stock, testStock1, 'stock symbol should match');
          assert.isNumber(res.body.stockData.price, 'price should be a number');
          assert.isNumber(res.body.stockData.likes, 'likes should be a number');
          assert.equal(res.body.stockData.likes, likesBeforeTest3, 'likes should not increase when same IP likes again');
          done();
        });
    });
    
    test('2 stocks', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({stock: [testStock1, testStock2]})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isObject(res.body, 'response should be an object');
          assert.property(res.body, 'stockData', 'response should have stockData property');
          assert.isArray(res.body.stockData, 'stockData should be an array for 2 stocks');
          assert.equal(res.body.stockData.length, 2, 'stockData array should have 2 elements');
          
          // Check first stock
          assert.isObject(res.body.stockData[0], 'first stock should be an object');
          assert.property(res.body.stockData[0], 'stock', 'first stock should have stock property');
          assert.property(res.body.stockData[0], 'price', 'first stock should have price property');
          assert.property(res.body.stockData[0], 'rel_likes', 'first stock should have rel_likes property');
          assert.notProperty(res.body.stockData[0], 'likes', 'first stock should not have likes property when viewing 2 stocks');
          assert.isString(res.body.stockData[0].stock, 'first stock symbol should be a string');
          assert.isNumber(res.body.stockData[0].price, 'first stock price should be a number');
          assert.isNumber(res.body.stockData[0].rel_likes, 'first stock rel_likes should be a number');
          
          // Check second stock
          assert.isObject(res.body.stockData[1], 'second stock should be an object');
          assert.property(res.body.stockData[1], 'stock', 'second stock should have stock property');
          assert.property(res.body.stockData[1], 'price', 'second stock should have price property');
          assert.property(res.body.stockData[1], 'rel_likes', 'second stock should have rel_likes property');
          assert.notProperty(res.body.stockData[1], 'likes', 'second stock should not have likes property when viewing 2 stocks');
          assert.isString(res.body.stockData[1].stock, 'second stock symbol should be a string');
          assert.isNumber(res.body.stockData[1].price, 'second stock price should be a number');
          assert.isNumber(res.body.stockData[1].rel_likes, 'second stock rel_likes should be a number');
          
          // Check that rel_likes are opposite of each other
          assert.equal(
            res.body.stockData[0].rel_likes + res.body.stockData[1].rel_likes, 
            0, 
            'rel_likes should be opposite of each other (sum should be 0)'
          );
          
          done();
        });
    });
    
    test('2 stocks with like', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({stock: [testStock1, testStock2], like: 'true'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isObject(res.body, 'response should be an object');
          assert.property(res.body, 'stockData', 'response should have stockData property');
          assert.isArray(res.body.stockData, 'stockData should be an array for 2 stocks');
          assert.equal(res.body.stockData.length, 2, 'stockData array should have 2 elements');
          
          // Check first stock
          assert.isObject(res.body.stockData[0], 'first stock should be an object');
          assert.property(res.body.stockData[0], 'stock', 'first stock should have stock property');
          assert.property(res.body.stockData[0], 'price', 'first stock should have price property');
          assert.property(res.body.stockData[0], 'rel_likes', 'first stock should have rel_likes property');
          assert.notProperty(res.body.stockData[0], 'likes', 'first stock should not have likes property when viewing 2 stocks');
          assert.isString(res.body.stockData[0].stock, 'first stock symbol should be a string');
          assert.isNumber(res.body.stockData[0].price, 'first stock price should be a number');
          assert.isNumber(res.body.stockData[0].rel_likes, 'first stock rel_likes should be a number');
          
          // Check second stock
          assert.isObject(res.body.stockData[1], 'second stock should be an object');
          assert.property(res.body.stockData[1], 'stock', 'second stock should have stock property');
          assert.property(res.body.stockData[1], 'price', 'second stock should have price property');
          assert.property(res.body.stockData[1], 'rel_likes', 'second stock should have rel_likes property');
          assert.notProperty(res.body.stockData[1], 'likes', 'second stock should not have likes property when viewing 2 stocks');
          assert.isString(res.body.stockData[1].stock, 'second stock symbol should be a string');
          assert.isNumber(res.body.stockData[1].price, 'second stock price should be a number');
          assert.isNumber(res.body.stockData[1].rel_likes, 'second stock rel_likes should be a number');
          
          // Check that rel_likes are opposite of each other
          assert.equal(
            res.body.stockData[0].rel_likes + res.body.stockData[1].rel_likes, 
            0, 
            'rel_likes should be opposite of each other (sum should be 0)'
          );
          
          done();
        });
    });

  });

});