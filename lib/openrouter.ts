export async function openRouterChat(
  messages: { role: string; content: string }[],
  model: string = 'google/gemini-2.5-flash',
  requireJson: boolean = true
) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const bodyData: { model: string; messages: { role: string; content: string }[]; response_format?: { type: string } } = {
    model,
    messages,
  };
  if (requireJson) {
    bodyData.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3008',
      'X-Title': 'AI Content Planner',
    },
    body: JSON.stringify(bodyData),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();

  if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
    throw new Error(`OpenRouter API returned invalid response structure: ${JSON.stringify(data).substring(0, 200)}`);
  }

  const content = data.choices[0].message?.content;
  if (!content) {
    throw new Error(`OpenRouter API response missing message.content: ${JSON.stringify(data.choices[0]).substring(0, 200)}`);
  }

  return content;
}
