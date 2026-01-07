// /api/prices.js - Fetches live stock prices from Yahoo Finance
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    const { symbols } = req.query;
    
    if (!symbols) {
        return res.status(400).json({ success: false, error: 'Missing symbols parameter' });
    }

    const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
    
    try {
        // Use Yahoo Finance v8 API
        const results = await Promise.all(
            symbolList.map(async (symbol) => {
                try {
                    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
                    const response = await fetch(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    
                    if (!response.ok) {
                        console.error(`Yahoo API error for ${symbol}: ${response.status}`);
                        return null;
                    }
                    
                    const data = await response.json();
                    const quote = data.chart?.result?.[0];
                    
                    if (!quote) return null;
                    
                    const meta = quote.meta;
                    const price = meta.regularMarketPrice;
                    const prevClose = meta.chartPreviousClose || meta.previousClose;
                    const change = price - prevClose;
                    const changePercent = (change / prevClose) * 100;
                    
                    return {
                        symbol,
                        price: parseFloat(price.toFixed(2)),
                        change: parseFloat(change.toFixed(2)),
                        changePercent: parseFloat(changePercent.toFixed(2)),
                        prevClose: parseFloat(prevClose.toFixed(2)),
                        timestamp: Date.now()
                    };
                } catch (err) {
                    console.error(`Error fetching ${symbol}:`, err.message);
                    return null;
                }
            })
        );

        const validResults = results.filter(r => r !== null);
        
        return res.status(200).json({
            success: true,
            data: validResults,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
