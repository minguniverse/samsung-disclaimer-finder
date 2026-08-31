const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 디버깅용
console.log('API Key 설정:', process.env.ANTHROPIC_API_KEY ? '✓' : '✗');

app.post('/api/search', async (req, res) => {
  try {
    const { feature } = req.body;
    
    if (!feature || !feature.trim()) {
      return res.status(400).json({ error: '기능을 입력해주세요' });
    }

    console.log(`검색 시작: "${feature}"`);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API 키가 설정되지 않았습니다. .env 파일을 확인하세요.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
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
      console.error('Claude API 오류:', errorData);
      return res.status(response.status).json({ 
        error: `Claude API 오류: ${errorData.error?.message || '알 수 없는 오류'}` 
      });
    }

    const data = await response.json();
    console.log('API 응답 받음');

    if (!data.content) {
      return res.status(500).json({ error: 'API 응답 오류' });
    }

    let rawText = '';
    for (const block of data.content) {
      if (block.type === 'text') {
        rawText += block.text;
      }
    }

    console.log('응답 텍스트 길이:', rawText.length);

    // JSON 추출
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('JSON을 찾을 수 없음. 응답:', rawText.substring(0, 200));
      return res.status(500).json({ error: '응답에서 JSON을 찾을 수 없습니다' });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log(`검색 결과: ${parsed.disclaimers?.length || 0}개`);

    if (!parsed.disclaimers || !Array.isArray(parsed.disclaimers)) {
      return res.status(500).json({ error: '잘못된 응답 형식' });
    }

    return res.status(200).json({ disclaimers: parsed.disclaimers });
  } catch (error) {
    console.error('서버 오류:', error);
    return res.status(500).json({ error: `서버 오류: ${error.message}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║  🚀 Samsung Disclaimer Finder 서버 실행 중...        ║
║                                                       ║
║  📱 브라우저에서 열기:                               ║
║     👉 http://localhost:${PORT}                      ║
║                                                       ║
║  📋 API:                                             ║
║     POST http://localhost:${PORT}/api/search        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});
