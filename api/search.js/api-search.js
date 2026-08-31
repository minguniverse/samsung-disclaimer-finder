// Vercel Serverless Function
// 경로: /api/search.js

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { feature } = req.body;
    
    if (!feature || !feature.trim()) {
      return res.status(400).json({ error: '기능을 입력해주세요' });
    }

    // Claude API 호출
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: `You MUST search for disclaimers related to the feature "${feature}" on Samsung UK (samsung.com/uk) and Samsung US (samsung.com/us) websites.

Your response MUST be ONLY valid JSON, nothing else. No markdown, no explanation, no additional text before or after.

JSON format must be exactly:
{
  "disclaimers": [
    {
      "country": "UK",
      "productName": "Product Name",
      "releaseYear": 2024,
      "disclaimer": "Full disclaimer text here"
    }
  ]
}

If no disclaimers found, return: {"disclaimers": []}

Start your response with { and end with }`
          }
        ],
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search'
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API error:', errorData);
      return res.status(response.status).json({ 
        error: `Claude API 오류: ${errorData.error?.message || '알 수 없는 오류'}` 
      });
    }

    const data = await response.json();

    if (!data.content) {
      return res.status(500).json({ error: 'API 응답 오류' });
    }

    let rawText = '';
    for (const block of data.content) {
      if (block.type === 'text') {
        rawText += block.text;
      }
    }

    // JSON 추출
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not find JSON in response:', rawText);
      return res.status(500).json({ error: '응답에서 JSON을 찾을 수 없습니다' });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.disclaimers || !Array.isArray(parsed.disclaimers)) {
      return res.status(500).json({ error: '잘못된 응답 형식' });
    }

    return res.status(200).json({ disclaimers: parsed.disclaimers });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: `서버 오류: ${error.message}` 
    });
  }
}
