const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// data.json 읽기
function loadData() {
  try {
    const dataPath = path.join(__dirname, 'public', 'data.json');
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading data.json:', error);
  }
  return {};
}

app.post('/api/search', (req, res) => {
  try {
    const { feature } = req.body;
    
    if (!feature || !feature.trim()) {
      return res.status(400).json({ error: '기능을 입력해주세요' });
    }

    const searchTerm = feature.toLowerCase();
    const data = loadData();
    
    let results = data[searchTerm] || [];
    
    if (results.length === 0) {
      results = [
        {
          country: 'UK',
          productName: `${feature} - Samsung UK`,
          disclaimer: `삼성 UK에서 "${feature}" 관련 제품을 확인하세요.`,
          link: `https://www.samsung.com/uk/search/?q=${encodeURIComponent(feature)}`
        },
        {
          country: 'US',
          productName: `${feature} - Samsung US`,
          disclaimer: `삼성 US에서 "${feature}" 관련 제품을 확인하세요.`,
          link: `https://www.samsung.com/us/search/?q=${encodeURIComponent(feature)}`
        }
      ];
    }
    
    results = results.map(item => ({
      ...item,
      releaseYear: 2024,
      link: item.link || (item.country === 'US'
        ? `https://www.samsung.com/us/search/?q=${encodeURIComponent(feature)}`
        : `https://www.samsung.com/uk/search/?q=${encodeURIComponent(feature)}`)
    }));

    return res.status(200).json({ disclaimers: results });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: '서버 오류' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Using data from public/data.json`);
});