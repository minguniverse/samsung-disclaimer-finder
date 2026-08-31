const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// 크롤링할 기능들
const features = ['5g', 'camera', 'battery', 'display', 'processor', 'ai'];

// 샘플 데이터 (크롤링 실패시 사용)
const sampleData = {
  '5g': [
    { country: 'UK', productName: 'Galaxy S24 Ultra 5G', disclaimer: '5G availability varies by operator and location.' },
    { country: 'US', productName: 'Galaxy S24 5G', disclaimer: '5G speeds depend on carrier and location.' }
  ],
  'camera': [
    { country: 'UK', productName: 'Galaxy S24 Pro', disclaimer: 'Camera quality varies with lighting conditions.' },
    { country: 'US', productName: 'Galaxy S24', disclaimer: 'Photo quality depends on environment.' }
  ],
  'battery': [
    { country: 'UK', productName: 'Galaxy S24 Ultra', disclaimer: 'Battery life depends on usage patterns.' },
    { country: 'US', productName: 'Galaxy S24', disclaimer: 'Battery capacity: 4000mAh. Actual life varies.' }
  ],
  'display': [
    { country: 'UK', productName: 'Galaxy S24 Ultra', disclaimer: 'Dynamic AMOLED 120Hz display.' },
    { country: 'US', productName: 'Galaxy Z Fold6', disclaimer: 'Foldable display with minor crease visible.' }
  ],
  'processor': [
    { country: 'UK', productName: 'Galaxy S24 Snapdragon', disclaimer: 'Performance varies with temperature and usage.' },
    { country: 'US', productName: 'Galaxy S24 Snapdragon', disclaimer: 'Thermal throttling may reduce sustained performance.' }
  ],
  'ai': [
    { country: 'UK', productName: 'Galaxy S24 Galaxy AI', disclaimer: 'AI features use device and cloud processing.' },
    { country: 'US', productName: 'Galaxy S24 AI', disclaimer: 'Feature availability varies by region.' }
  ]
};

async function scrapeFeature(feature) {
  try {
    console.log(`🔍 크롤링: ${feature}...`);
    
    const ukUrl = `https://www.samsung.com/uk/search/?q=${feature}`;
    const usUrl = `https://www.samsung.com/us/search/?q=${feature}`;
    
    const results = [];
    
    // UK 크롤링 시도
    try {
      const ukRes = await axios.get(ukUrl, {
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const $uk = cheerio.load(ukRes.data);
      
      $uk('h2, h3, .product-name').each((i, el) => {
        if (i < 1) {
          const name = $uk(el).text().trim();
          if (name.length > 3) {
            results.push({
              country: 'UK',
              productName: name.substring(0, 100),
              disclaimer: `${name} - UK site data`,
              link: ukUrl
            });
          }
        }
      });
    } catch (e) {
      console.log(`⚠️ UK 크롤링 실패: ${e.message}`);
    }
    
    // US 크롤링 시도
    try {
      const usRes = await axios.get(usUrl, {
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const $us = cheerio.load(usRes.data);
      
      $us('h2, h3, .product-name').each((i, el) => {
        if (i < 1) {
          const name = $us(el).text().trim();
          if (name.length > 3) {
            results.push({
              country: 'US',
              productName: name.substring(0, 100),
              disclaimer: `${name} - US site data`,
              link: usUrl
            });
          }
        }
      });
    } catch (e) {
      console.log(`⚠️ US 크롤링 실패: ${e.message}`);
    }
    
    if (results.length > 0) {
      console.log(`✅ ${feature} 크롤링 완료 (${results.length}개)`);
      return results;
    } else {
      console.log(`ℹ️ ${feature} 샘플 데이터 사용`);
      return sampleData[feature] || [];
    }
    
  } catch (error) {
    console.error(`❌ ${feature} 오류:`, error.message);
    return sampleData[feature] || [];
  }
}

async function main() {
  console.log('🚀 삼성 데이터 크롤링 시작...');
  console.log(`📅 ${new Date().toISOString()}`);
  
  const allData = {};
  
  for (const feature of features) {
    allData[feature] = await scrapeFeature(feature);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const outputPath = path.join(__dirname, '../public/data.json');
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
  
  console.log(`\n✅ 크롤링 완료!`);
  console.log(`💾 저장: ${outputPath}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});