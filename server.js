const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 정적 파일 제공 (public 폴더)
app.use(express.static(path.join(__dirname, 'public')));

// API 엔드포인트
app.post('/api/search', (req, res) => {
  try {
    const { feature } = req.body;
    
    if (!feature || !feature.trim()) {
      return res.status(400).json({ error: '기능을 입력해주세요' });
    }

    console.log(`검색: "${feature}"`);

    // 검색 결과 반환
    const disclaimers = [
      {
        country: 'UK',
        productName: `${feature} 관련 제품`,
        releaseYear: 2024,
        disclaimer: `삼성 UK 사이트에서 "${feature}" 검색 결과를 보려면 아래 버튼을 클릭하세요.`,
        link: `https://www.samsung.com/uk/search/?q=${encodeURIComponent(feature)}`
      },
      {
        country: 'US',
        productName: `${feature} 관련 제품`,
        releaseYear: 2024,
        disclaimer: `삼성 US 사이트에서 "${feature}" 검색 결과를 보려면 아래 버튼을 클릭하세요.`,
        link: `https://www.samsung.com/us/search/?q=${encodeURIComponent(feature)}`
      }
    ];

    return res.status(200).json({ disclaimers: disclaimers });

  } catch (error) {
    console.error('오류:', error);
    return res.status(500).json({ error: `서버 오류: ${error.message}` });
  }
});

// index.html 제공 (SPA 폴백)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 없는 경로는 index.html로 (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('에러:', err);
  res.status(500).json({ error: '서버 오류' });
});

// 포트
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중... http://localhost:${PORT}`);
});