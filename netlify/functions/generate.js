exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { product } = JSON.parse(event.body);
  if (!product) return { statusCode: 400, body: 'Product required' };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEy,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are an expert e-commerce marketer. For the product: "${product}"

Return a JSON object with this exact structure:
{
  "audience": {
    "age": "age range",
    "gender": "gender breakdown",
    "interests": ["interest1", "interest2", "interest3", "interest4"],
    "platforms": ["platform1", "platform2"],
    "painPoints": ["pain point 1", "pain point 2"]
  },
  "adCopy": {
    "tiktokHook": "attention-grabbing opening line for TikTok",
    "metaHeadline": "Facebook/Instagram ad headline",
    "bodyText": "2-3 sentence ad body copy",
    "videoScript": "15-second video script outline",
    "videoSearchQuery": "best YouTube search query to find a viral TikTok or ad video closely related to this product (short, 4-6 words)"
  }
}

Return only valid JSON, no other text.`
      }]
    })
  });

  const data = await response.json();

  if (!response.ok || !data.content) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: data.error?.message || 'API error', raw: data })
    };
  }

  const text = data.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const result = JSON.parse(jsonMatch ? jsonMatch[0] : text);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result)
  };
};
