const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/search', async (req, res) => {
  try {
    const { feature } = req.body;
    
    if (!feature || !feature.trim()) {
      return res.status(400).json({ error: '기능을 입력해주세요' });
    }

    console.log(`검색: "${feature}"`);
    const disclaimers = [];

    // UK 검색
    try {
      const ukUrl = `https://www.samsung.com/uk/search/?q=${encodeURIComponent(feature)}`;
      const ukRes = await axios.get(ukUrl, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $uk = cheerio.load(ukRes.data);
      
      $uk('h2, h3, .product-name, [data-product]').each((i, el) => {
        const text =