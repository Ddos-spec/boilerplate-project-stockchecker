'use strict';

const fetch = require('node-fetch');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Stock schema for MongoDB
const stockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true },
  likes: { type: Number, default: 0 },
  likedIPs: [String] // Array of hashed IP addresses
});

const Stock = mongoose.model('Stock', stockSchema);

// Function to hash IP addresses for anonymization
function hashIP(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

// Function to fetch stock price from the proxy API
async function fetchStockPrice(symbol) {
  try {
    const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`);
    const data = await response.json();
    return data.latestPrice;
  } catch (error) {
    console.error('Error fetching stock price:', error);
    return null;
  }
}

// Function to get or create stock in database
async function getOrCreateStock(symbol) {
  try {
    let stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) {
      stock = new Stock({
        symbol: symbol.toUpperCase(),
        likes: 0,
        likedIPs: []
      });
      await stock.save();
    }
    return stock;
  } catch (error) {
    console.error('Error getting/creating stock:', error);
    return null;
  }
}

// Function to handle liking a stock
async function likeStock(symbol, ip) {
  try {
    const hashedIP = hashIP(ip);
    const stock = await getOrCreateStock(symbol);
    
    if (!stock) {
      return null;
    }
    
    // Check if this IP has already liked this stock
    if (!stock.likedIPs.includes(hashedIP)) {
      stock.likes += 1;
      stock.likedIPs.push(hashedIP);
      await stock.save();
    }
    
    return stock;
  } catch (error) {
    console.error('Error liking stock:', error);
    return null;
  }
}

// Function to get stock data with price
async function getStockData(symbol, like = false, ip = null) {
  try {
    let stock;
    
    if (like && ip) {
      stock = await likeStock(symbol, ip);
    } else {
      stock = await getOrCreateStock(symbol);
    }
    
    if (!stock) {
      return null;
    }
    
    const price = await fetchStockPrice(symbol);
    
    if (price === null) {
      return null;
    }
    
    return {
      stock: stock.symbol,
      price: price,
      likes: stock.likes
    };
  } catch (error) {
    console.error('Error getting stock data:', error);
    return null;
  }
}

// Function to calculate relative likes for two stocks
function calculateRelativeLikes(stock1Data, stock2Data) {
  const stock1RelLikes = stock1Data.likes - stock2Data.likes;
  const stock2RelLikes = stock2Data.likes - stock1Data.likes;
  
  return {
    stock1: {
      ...stock1Data,
      rel_likes: stock1RelLikes
    },
    stock2: {
      ...stock2Data,
      rel_likes: stock2RelLikes
    }
  };
}

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res) {
      try {
        const { stock, like } = req.query;
        const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                        (req.connection.socket ? req.connection.socket.remoteAddress : null);
        
        // Check if stock parameter is provided
        if (!stock) {
          return res.json({ error: 'Stock symbol is required' });
        }
        
        const likeStock = like === 'true';
        
        // Handle single stock vs multiple stocks
        if (Array.isArray(stock)) {
          // Two stocks case
          if (stock.length !== 2) {
            return res.json({ error: 'Please provide exactly 1 or 2 stock symbols' });
          }
          
          const [symbol1, symbol2] = stock;
          
          // Get stock data for both stocks
          const stock1Data = await getStockData(symbol1, likeStock, clientIP);
          const stock2Data = await getStockData(symbol2, likeStock, clientIP);
          
          if (!stock1Data || !stock2Data) {
            return res.json({ error: 'Unable to fetch stock data' });
          }
          
          // Calculate relative likes
          const { stock1: stock1WithRelLikes, stock2: stock2WithRelLikes } = 
            calculateRelativeLikes(stock1Data, stock2Data);
          
          // Remove the 'likes' property and keep only 'rel_likes'
          delete stock1WithRelLikes.likes;
          delete stock2WithRelLikes.likes;
          
          return res.json({
            stockData: [stock1WithRelLikes, stock2WithRelLikes]
          });
          
        } else {
          // Single stock case
          const stockData = await getStockData(stock, likeStock, clientIP);
          
          if (!stockData) {
            return res.json({ error: 'Unable to fetch stock data' });
          }
          
          return res.json({
            stockData: stockData
          });
        }
        
      } catch (error) {
        console.error('API Error:', error);
        res.json({ error: 'Internal server error' });
      }
    });
    
};