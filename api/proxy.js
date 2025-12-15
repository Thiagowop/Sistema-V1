import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { endpoint } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint parameter is required' });
  }

  // Construct the ClickUp API URL
  // We restore the query string from the original URL if any (excluding 'endpoint')
  // But Vercel passes 'endpoint' via the rewrite query param.
  // The original query params might be lost if we don't be careful.
  // A simple way is to just append the endpoint to the base URL.
  // Note: 'endpoint' will contain the path like "team/123/task?archived=false"
  
  const clickupUrl = `https://api.clickup.com/api/v2/${endpoint}`;

  try {
    console.log(`Proxying to: ${clickupUrl}`);
    
    const response = await fetch(clickupUrl, {
      method: req.method,
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json'
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
