export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.name;
    if (!apiKey) {
      return res.status(500).json({ error: 'Anthropic API key is not configured in Vercel Production environment variables.' });
    }

    // Vercel normally parses application/json into req.body automatically.
    // Handle object, string, and Buffer bodies safely.
    let body = req.body;
    if (Buffer.isBuffer(body)) body = body.toString('utf8');
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        return res.status(400).json({ error: 'Invalid JSON request body.', details: parseError.message });
      }
    }
    body = body || {};

    const incomingMessages = body.messages;
    if (!Array.isArray(incomingMessages) || incomingMessages.length === 0) {
      return res.status(400).json({ error: 'messages must be a non-empty array.' });
    }

    const messages = incomingMessages.map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: typeof message.content === 'string'
        ? message.content
        : Array.isArray(message.content)
          ? message.content
          : String(message.content ?? '')
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages
      })
    });

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { error: raw || 'Empty response from Anthropic.' };
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Anthropic API request failed.', status: response.status, details: data });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Waypoint AI error:', error);
    return res.status(500).json({ error: 'Unable to reach the AI service.', details: error instanceof Error ? error.message : String(error) });
  }
}
