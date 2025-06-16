'use strict';

const fetch = require('node-fetch');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Stock schema for MongoDB - This is already correct.
const stockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true },
  likes: { type: Number, default: 0 },
  likedIPs: [String] // Array of hashed IP addresses
});

const Stock = mongoose.model('Stock', stockSchema);

// Function to hash IP addresses for anonymization - This is correct.
function hashIP(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

// Function to fetch stock price from the proxy API
async function fetchStockPrice(symbol) {
  try {
    const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol.toUpperCase()}/quote`);
    if (!response.ok) { // Check if the fetch was successful
      return null;
    }
    const data = await response.json();
    // The proxy can return "Unknown symbol" for invalid stocks
    if (typeof data === 'string') {
        return null;
    }
    return { price: data.latestPrice, symbol: data.symbol };
  } catch (error) {
    console.error('Error fetching stock price:', error);
    return null;
  }
}

// Unified function to process a single stock
async function processStock(symbol, applyLike, ip) {
    const fetchedData = await fetchStockPrice(symbol);
    
    // If stock symbol is invalid from external API
    if (!fetchedData) {
      return { error: 'invalid symbol', stock: symbol };
    }

    let stockDoc = await Stock.findOne({ symbol: fetchedData.symbol });

    if (!stockDoc) {
        stockDoc = new Stock({ symbol: fetchedData.symbol, likes: 0, likedIPs: [] });
    }

    if (applyLike) {
        const hashedIP = hashIP(ip);
        if (!stockDoc.likedIPs.includes(hashedIP)) {
            stockDoc.likes++;
            stockDoc.likedIPs.push(hashedIP);
        }
    }
    
    await stockDoc.save();

    return {
        stock: stockDoc.symbol,
        price: fetchedData.price,
        likes: stockDoc.likes
    };
}


module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res) {
      try {
        const { stock, like } = req.query;
        // FIX #1: Renamed variable to avoid conflict and be clearer.
        const applyLike = like === 'true';
        // FIX #2: Simplified IP retrieval. `req.ip` is sufficient for this project.
        const clientIP = req.ip;

        if (!stock || stock === '') {
          return res.json({ error: 'invalid stock' });
        }

        if (Array.isArray(stock)) {
          // --- Two stocks case ---
          if (stock.length !== 2) {
            return res.json({ error: 'Please provide exactly 2 stock symbols' });
          }

          // FIX #3: Fetch and process both stocks in parallel for efficiency.
          const [stock1Result, stock2Result] = await Promise.all([
              processStock(stock[0], applyLike, clientIP),
              processStock(stock[1], applyLike, clientIP)
          ]);

          // Handle invalid stock symbols
          if (stock1Result.error || stock2Result.error) {
              return res.json({ error: 'one or more stock symbols are invalid' });
          }
          
          const stockData = [
              {
                  stock: stock1Result.stock,
                  price: stock1Result.price,
                  rel_likes: stock1Result.likes - stock2Result.likes
              },
              {
                  stock: stock2Result.stock,
                  price: stock2Result.price,
                  rel_likes: stock2Result.likes - stock1Result.likes
              }
          ];

          return res.json({ stockData });

        } else {
          // --- Single stock case ---
          const stockResult = await processStock(stock, applyLike, clientIP);
          
          if (stockResult.error) {
              return res.json({ stockData: { error: "invalid symbol", likes: 0 }});
          }

          return res.json({ stockData: stockResult });
        }
        
      } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    
};
