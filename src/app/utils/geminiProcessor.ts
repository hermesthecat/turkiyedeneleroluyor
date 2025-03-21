import { IHaber } from '@/app/models/Haber';
import axios from 'axios';

// Gemini API için gerekli tip tanımlamaları
interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

interface ProcessedNews {
  baslik: string;
  ozet: string;
  icerik: string;
  etiketler: string[];
}

/**
 * Haberi Gemini API'ye gönderip işlenmiş haberi alır
 */
export async function processNewsWithGemini(haber: Partial<IHaber>): Promise<Partial<IHaber>> {
  try {
    console.log(`Gemini API'ye haber gönderiliyor: ${haber.baslik}`);
    
    // API anahtarını .env dosyasından al
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY bulunamadı. .env.local dosyasına eklediğinizden emin olun.");
      return haber; // Anahtar yoksa orijinal haberi döndür
    }
    
    // Gemini'ye gönderilecek istek metni
    const prompt = `Aşağıdaki haberi oku, analiz et ve daha ilgi çekici ve bilgilendirici hale getir.

Orijinal Başlık: ${haber.baslik}
Orijinal Özet: ${haber.ozet}
Orjinal İçerik: ${haber.icerik || "İçerik yok"}
Kaynak: ${haber.kaynak}
Kategori: ${haber.kategori || "Genel"}

Görevin:
1. Daha çarpıcı ve bilgilendirici bir başlık yaz (maksimum 100 karakter)
2. Haberin özünü anlatan, merak uyandıran kısa bir özet hazırla (maksimum 200 karakter) 
3. Haberi daha detaylı ve eksiksiz bir şekilde yeniden yaz (HTML formatında, minimum 3 paragraf, <p> etiketleriyle)
4. Haber için 3-5 adet ilgili etiket öner

Yanıtını tam olarak şu JSON formatında döndür (başka bir şey yazma):
{
  "baslik": "Yeni başlık",
  "ozet": "Yeni özet",
  "icerik": "<p>Birinci paragraf</p><p>İkinci paragraf</p><p>Üçüncü paragraf</p>",
  "etiketler": ["etiket1", "etiket2", "etiket3"]
}`;

    // Gemini API'sine istek gönder
    try {
      console.log(`Gemini API'ye istek gönderiliyor: ${apiKey.substring(0, 5)}...`);
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }
      );

      // API yanıtını işle
      const data: GeminiResponse = response.data;
      
      // Response içeriğini kontrol et
      if (!data || !data.candidates || !data.candidates.length || !data.candidates[0].content) {
        console.error("Gemini API yanıtı boş veya geçersiz format döndürdü:", data);
        return haber; // Orijinal haberi döndür
      }
      
      const generatedText = data.candidates[0].content.parts[0].text;
      
      // JSON yanıtını işle
      try {
        // Gemini bazen JSON etrafına ``` ekleyebilir, bunları kaldır
        const cleanedText = generatedText.replace(/```json\n|\n```|```/g, "");
        const processedNews: ProcessedNews = JSON.parse(cleanedText);
        
        // Güncellenmiş haberi döndür
        return {
          ...haber,
          baslik: processedNews.baslik,
          ozet: processedNews.ozet,
          icerik: processedNews.icerik,
          etiketler: processedNews.etiketler,
        };
      } catch (parseError) {
        console.error("Gemini yanıtı JSON olarak ayrıştırılamadı:", parseError);
        console.log("Alınan yanıt:", generatedText);
        return haber; // Ayrıştırma hatası durumunda orijinal haberi döndür
      }
    } catch (error: any) {
      // Hata detaylarını daha kapsamlı logla
      console.error("Gemini API hatası:");
      
      if (error.response) {
        // Sunucunun yanıt döndüğü durumda
        console.error(`Durum kodu: ${error.response.status}`);
        console.error(`Hata mesajı: ${JSON.stringify(error.response.data)}`);
        console.error(`Hata başlıkları: ${JSON.stringify(error.response.headers)}`);
      } else if (error.request) {
        // İstek yapıldı ama yanıt alınamadı
        console.error("Yanıt alınamadı");
        console.error(error.request);
      } else {
        // İstek oluşturulurken bir hata oldu
        console.error("İstek hatası:", error.message);
      }
      
      // Orijinal haberi değiştirmeden döndür
      return haber;
    }
  } catch (error) {
    console.error("Gemini API hatası:", error);
    return haber; // Hata durumunda orijinal haberi döndür
  }
}

/**
 * Birden fazla haberi toplu olarak işle
 */
export async function batchProcessNewsWithGemini(haberler: Partial<IHaber>[]): Promise<Partial<IHaber>[]> {
  console.log(`${haberler.length} haber Gemini ile işlenecek`);
  
  // Gemini API'yi aşırı yüklememek için ardışık işleme
  const processedNews: Partial<IHaber>[] = [];
  
  for (const haber of haberler) {
    try {
      // Her bir haberi işle
      const processedHaber = await processNewsWithGemini(haber);
      processedNews.push(processedHaber);
      
      // API istekleri arasında kısa bir bekleme süresi
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Haber işleme hatası (${haber.baslik}):`, error);
      processedNews.push(haber); // Hata durumunda orijinal haberi ekle
    }
  }
  
  console.log(`${processedNews.length} haber başarıyla işlendi`);
  return processedNews;
} 