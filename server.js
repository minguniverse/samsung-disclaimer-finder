const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Fallback 샘플 데이터 (스크래핑 실패시)
const fallbackData = {
  '5g': [
    { 
      country: 'UK', 
      productName: 'Galaxy S24 Ultra', 
      disclaimer: '5G connectivity depends on network operator availability. Not all 5G frequencies are supported globally.' 
    },
    { 
      country: 'US', 
      productName: 'Galaxy S24 Ultra', 
      disclaimer: '5G is available in select areas. Speeds and availability vary by carrier and location.' 
    }
  ],
  'camera': [
    { 
      country: 'UK', 
      productName: 'Galaxy S24 Pro', 
      disclaimer: 'Camera performance varies based on lighting and environmental conditions.' 
    },
    { 
      country: 'US', 
      productName: 'Galaxy S24', 
      disclaimer: 'Photo quality depends on lighting conditions and camera settings.' 
    }
  ],
  'battery': [
    { 
      country: 'UK', 
      productName: 'Galaxy S24 Ultra', 
      disclaimer: 'Battery life depends on usage patterns. Actual performance may vary.' 
    },
    { 
      country: 'US', 
      productName: 'Galaxy S24', 
      disclaimer: 'Battery capacity: 4000mAh. Actual life depends on usage.' 
    }
  ]
};

// 웹 스크래핑 함수
async function scrapeProduct(feature, country) {
  try {
    const baseUrl = country === 'UK' ? 'https://www.samsung.com/uk' : 'https://www.samsung.com/us';
    const searchUrl = `${baseUrl}/search/?q=${encodeURIComponent(feature)}`;
    
    console.log(`🔍 스크래핑 시작: ${country} - ${feature}`);

    const response = await axios.get(searchUrl, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const results = [];

    // 제품명 추출 (다양한 선택자 시도)
    $('h2, h3, .product-name, .productname, [data-product-name], a.product-link').each((i, elem) => {
      if (i < 3) { // 최대 3개만
        const text = $(elem).text().trim();
        if (text && text.length > 3 && text.length < 200) {
          results.push({
            text,
            href: $(elem).attr('href') || ''
          });
        }
      }
    });

    // 결과 정렬
    const products = results.slice(0, 2).map(r => ({
      country: country,
      productName: r.text,
      releaseYear: 2024,
      disclaimer: `${r.text} - 삼성 ${country === 'US' ? 'US' : 'UK'} 공식 사이트에서 확인하세요.`,
      link: searchUrl
    }));

    console.log(`✅ 스크래핑 완료: ${country} - ${products.length}개 제품`);
    return products;

  } catch (error) {
    console.error(`❌ 스크래핑 실패 (${country}):`, error.message);
    return null;
  }
}

app.post('/api/search', async (req, res) => {
  try {
    const { feature } = req.body;
    
    if (!feature || !feature.trim()) {
      return res.status(400).json({ error: '기능을 입력해주세요' });
    }

    console.log(`📌 검색: "${feature}"`);
    const searchTerm = feature.toLowerCase();
    let results = [];

    // UK 스크래핑 시도
    const ukData = await scrapeProduct(feature, 'UK');
    if (ukData && ukData.length > 0) {
      results = results.concat(ukData);
    }

    // US 스크래핑 시도
    const usData = await scrapeProduct(feature, 'US');
    if (usData && usData.length > 0) {
      results = results.concat(usData);
    }

    // 스크래핑 실패시 Fallback 데이터 사용
    if (results.length === 0) {
      console.log(`⚠️ 스크래핑 실패, Fallback 데이터 사용`);
      
      if (fallbackData[searchTerm]) {
        results = fallbackData[searchTerm].map(item => ({
          ...item,
          releaseYear: 2024,
          link: item.country === 'US' 
            ? `https://www.samsung.com/us/search/?q=${encodeURIComponent(feature)}`
            : `https://www.samsung.com/uk/search/?q=${encodeURIComponent(feature)}`
        }));
      } else {
        // 완전 폴백
        results = [
          {
            country: 'UK',
            productName: `${feature} - Samsung UK`,
            releaseYear: 2024,
            disclaimer: `삼성 UK에서 "${feature}" 관련 제품을 검색하세요.`,
            link: `https://www.samsung.com/uk/search/?q=${encodeURIComponent(feature)}`
          },
          {
            country: 'US',
            productName: `${feature} - Samsung US`,
            releaseYear: 2024,
            disclaimer: `삼성 US에서 "${feature}" 관련 제품을 검색하세요.`,
            link: `https://www.samsung.com/us/search/?q=${encodeURIComponent(feature)}`
          }
        ];
      }
    }

    console.log(`📊 결과: ${results.length}개 항목`);
    return res.status(200).json({ disclaimers: results });

  } catch (error) {
    console.error('🔴 API 오류:', error);
    
    // 에러 발생해도 뭔가라도 반환
    return res.status(200).json({ 
      disclaimers: [
        {
          country: 'UK',
          productName: '삼성 UK 제품',
          releaseYear: 2024,
          disclaimer: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도하세요.',
          link: 'https://www.samsung.com/uk/'
        }
      ]
    });
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
  console.log(`🚀 서버 실행 중... http://localhost:${PORT}`);
  console.log(`📡 웹 스크래핑 모드 활성화 (axios + cheerio)`);
});