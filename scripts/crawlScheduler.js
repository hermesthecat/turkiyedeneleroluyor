const cron = require('node-cron');
const axios = require('axios');
const dotenv = require('dotenv');

// Çevre değişkenlerini yükle
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.CRAWLER_API_KEY;
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://sizin-site-adresi.com' 
  : 'http://localhost:3000';

// Her saat başı haberleri çek (0. dakikada)
cron.schedule('0 * * * *', async () => {
  console.log('Haber çekme zamanı:', new Date().toLocaleString());
  
  try {
    const response = await axios.get(`${BASE_URL}/api/crawl`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    console.log('Haber çekme sonucu:', response.data);
  } catch (error) {
    console.error('Haber çekme hatası:', error.message);
    if (error.response) {
      console.error('Hata detayı:', error.response.data);
    }
  }
});

console.log('Zamanlayıcı başlatıldı. Her saat başı haberleri çekecek.'); 