export async function openRouterChat(
  messages: { role: string; content: string }[],
  model: string = 'google/gemini-2.5-flash',
  requireJson: boolean = true
) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const bodyData: any = {
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
      'HTTP-Referer': 'http://localhost:3000', // Update with actual URL in prod
      'X-Title': 'AI Content Planner',
    },
    body: JSON.stringify(bodyData),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
