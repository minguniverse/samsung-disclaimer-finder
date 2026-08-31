export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { feature } = req.body;
    
    if (!feature || !feature.trim()) {
      return res.status(400).json({ error: '기능을 입력해주세요' });
    }

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
}
