export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Primary secret name. The fallback keeps compatibility with the
    // previously-created Vercel variable named `name` without exposing it.
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.name;
    if (!apiKey) {
      return res.status(500).json({ error: 'Anthropic API key is not configured in Vercel Production environment variables.' });
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

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Waypoint AI error:', error);
    return res.status(500).json({ error: 'Unable to reach the AI service.' });
  }
}
