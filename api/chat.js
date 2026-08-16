export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.name;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Anthropic API key is not configured in Vercel Production environment variables.'
      });
    }

    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages must be a non-empty array.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
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
      return res.status(response.status).json({
        error: 'Anthropic API request failed.',
        status: response.status,
        details: data
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Waypoint AI error:', error);
    return res.status(500).json({
      error: 'Unable to reach the AI service.',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
