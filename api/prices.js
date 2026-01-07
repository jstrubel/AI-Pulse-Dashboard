// /api/prices.js
// Vercel Serverless Function to fetch stock prices from Yahoo Finance
// This runs on Vercel's servers, avoiding CORS issues

export default async function handler(req, res) {
  // Set CORS headers to allow your site to call this API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  // Get symbols from query string, e.g., /api/prices?symbols=NVDA,AAPL,MSFT
  const { symbols } = req.query;
  
  if (!symbols) {
    return res.status(400).json({ error: 'Missing symbols parameter' });
  }
  
  try {
    // Yahoo Finance API (unofficial but reliable)
    const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;
    
    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance responded with ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract just the data we need
    const prices = data.quoteResponse.result.map(quote => ({
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      previousClose: quote.regularMarketPreviousClose,
      marketState: quote.marketState, // PRE, REGULAR, POST, CLOSED
      lastUpdate: quote.regularMarketTime
    }));
    
    // Cache for 5 minutes (300 seconds) to avoid hitting rate limits
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: prices
    });
    
  } catch (error) {
    console.error('Price fetch error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch prices',
      message: error.message 
    });
  }
}
