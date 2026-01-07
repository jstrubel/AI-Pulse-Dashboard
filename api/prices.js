// Finnhub API - Professional Stock Data
const FINNHUB_KEY = 'd5fdi9pr01qnjhobk5igd5fdi9pr01qnjhobk5j0';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

    const { symbols, type } = req.query;

    if (!symbols) {
        return res.status(400).json({ success: false, error: 'Missing symbols parameter' });
    }

    const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());

    try {
        // Fetch quotes with rate limiting consideration
        const results = [];
        
        for (const symbol of symbolList) {
            const quote = await fetchQuote(symbol);
            if (quote) results.push(quote);
            // Small delay to respect rate limits
            await new Promise(r => setTimeout(r, 50));
        }

        return res.status(200).json({
            success: true,
            data: results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function fetchQuote(symbol) {
    try {
        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`Finnhub error for ${symbol}: ${response.status}`);
            return null;
        }

        const data = await response.json();
        
        // Finnhub returns: c=current, pc=previous close, h=high, l=low, o=open, d=change, dp=change percent
        if (!data || data.c === 0 || data.c === undefined) {
            return null;
        }

        return {
            symbol,
            price: parseFloat(data.c.toFixed(2)),
            change: parseFloat((data.d || 0).toFixed(2)),
            changePercent: parseFloat((data.dp || 0).toFixed(2)),
            high: data.h,
            low: data.l,
            open: data.o,
            prevClose: data.pc
        };
    } catch (err) {
        console.error(`Error fetching ${symbol}:`, err.message);
        return null;
    }
}
