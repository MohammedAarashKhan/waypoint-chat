export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.name;
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured in Vercel Production.' });
    }

    let body = req.body;
    if (Buffer.isBuffer(body)) body = body.toString('utf8');
    if (typeof body === 'string') {
      try { body = JSON.parse(body); }
      catch (e) { return res.status(400).json({ error: 'Invalid JSON request body.', details: e.message }); }
    }

    const incomingMessages = body?.messages;
    if (!Array.isArray(incomingMessages) || incomingMessages.length === 0) {
      return res.status(400).json({ error: 'messages must be a non-empty array.' });
    }

    const messages = incomingMessages.map((m) => ({
      role: m?.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m?.content === 'string' ? m.content : String(m?.content ?? '')
    })).filter(m => m.content.trim());

    if (!messages.length) return res.status(400).json({ error: 'No usable messages supplied.' });

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages
      })
    });

    const raw = await upstream.text();
    let data;
    try { data = JSON.parse(raw); }
    catch (e) {
      console.error('Anthropic non-JSON response:', upstream.status, raw.slice(0, 500));
      return res.status(502).json({ error: 'AI provider returned a non-JSON response.', status: upstream.status, details: raw.slice(0, 300) });
    }

    if (!upstream.ok) {
      console.error('Anthropic API error:', upstream.status, data);
      return res.status(502).json({ error: 'Anthropic API request failed.', status: upstream.status, details: data?.error?.message || data });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Waypoint AI error:', error);
    return res.status(500).json({ error: 'Unable to reach the AI service.', details: error instanceof Error ? error.message : String(error) });
  }
}
