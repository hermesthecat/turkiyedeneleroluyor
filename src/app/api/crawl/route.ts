import { NextRequest, NextResponse } from 'next/server';
import { tumKaynaklariCrawlEt } from '@/app/utils/haberCrawler';
import { processNewsWithGemini } from '@/app/utils/geminiProcessor';
import connectToDatabase from '@/app/lib/mongodb';

export interface IHaber {
  baslik: string;
  link: string;
  kaynak: string;
  tarih: string;
  icerik: string;
  ozetlendi: boolean;
  ozet?: string;
  kategori?: string;
  resim_url?: string;
  son_guncelleme?: Date;
}

export async function GET(request: NextRequest) {
  console.log('Crawler API erişimi başlatıldı');
  
  // API anahtarını URL'den al
  const apiKey = request.nextUrl.searchParams.get('apiKey');
  
  // .env.local'den gizli API anahtarını kontrol et
  const validApiKey = process.env.CRAWLER_API_KEY;
  
  // API anahtarı kontrolü
  // if (!apiKey || apiKey !== validApiKey) {
  //   console.log('Geçersiz API anahtarı ile erişim denemesi');
  //   return NextResponse.json(
  //     { 
  //       error: 'Geçersiz API anahtarı',
  //       message: 'API anahtarı eksik veya geçersiz. Lütfen geçerli bir API anahtarı sağlayın.' 
  //     }, 
  //     { status: 401 }
  //   );
  // }
  
  try {
    console.log('Crawler başlatılıyor...');
    
    // MongoDB'ye bağlan
    console.log('Veritabanına bağlanılıyor...');
    await connectToDatabase();
    
    // Mevcut tüm haberleri sil
    console.log('Veritabanındaki tüm haberler siliniyor...');
    const HaberModel = (await import('@/app/models/Haber')).default;
    const deleteResult = await HaberModel.deleteMany({});
    console.log(`Veritabanından ${deleteResult.deletedCount} haber silindi.`);
    
    // Tüm kaynakları crawl et
    const haberler = await tumKaynaklariCrawlEt();
    console.log(`Toplam ${haberler.length} haber bulundu.`);
    
    if (haberler.length === 0) {
      console.log('Hiç haber bulunamadı');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Şu anda haber yok. Lütfen daha sonra tekrar deneyin.' 
        }, 
        { status: 404 }
      );
    }
    
    // Gemini API anahtarını al
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    // Eğer Gemini API anahtarı varsa haberleri işle
    let islenmisDizi: IHaber[] = [];
    
    if (geminiApiKey) {
      console.log('Gemini API anahtarı bulundu, haberler işleniyor...');
      
      // Her bir haberi sırayla işle (Promise.all yerine)
      islenmisDizi = [];
      for (const haber of haberler) {
        try {
          console.log(`Sıradaki haber işleniyor: "${haber.baslik?.substring(0, 30)}..."`);
          const islenmisPosts = await processNewsWithGemini(haber as IHaber);
          if (islenmisPosts) {
            islenmisDizi.push(islenmisPosts as IHaber);
            console.log(`Haber başarıyla işlendi. İşlenen toplam haber: ${islenmisDizi.length}`);
          }
        } catch (error) {
          console.error(`Haber işleme hatası: ${error}`);
        }
        
        // Her istekten sonra kısa bir gecikme ekleyelim (rate limit'e takılmamak için)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`${islenmisDizi.length} haber başarıyla işlendi.`);
    } else {
      console.log('Gemini API anahtarı bulunamadı, haberler ham haliyle kaydedilecek.');
      islenmisDizi = haberler as IHaber[];
    }
    
    // Haberleri veritabanına ekle veya güncelle
    const bulkOps = islenmisDizi.map(haber => {
      // Tarih kontrolü - geçerli tarih oluştur
      let tarih;
      try {
        if (haber.tarih) {
          const tempDate = new Date(haber.tarih);
          // Geçerli bir tarih mi kontrol et
          tarih = !isNaN(tempDate.getTime()) ? tempDate : new Date();
        } else {
          tarih = new Date();
        }
      } catch (error) {
        console.log(`Tarih dönüştürme hatası: ${error}. Şimdiki zaman kullanılıyor.`);
        tarih = new Date();
      }
      
      return {
        updateOne: {
          filter: { kaynak_url: haber.link },
          update: { $set: { 
            baslik: haber.baslik,
            ozet: haber.ozet || `${haber.baslik} hakkında detaylı bilgi için tıklayın.`,
            icerik: haber.icerik || '',
            kaynak: haber.kaynak,
            kaynak_url: haber.link,
            resim_url: haber.resim_url || '',
            kategori: haber.kategori || 'Genel',
            etiketler: [],
            yayinTarihi: tarih
          }},
          upsert: true
        }
      };
    });
    
    if (bulkOps.length > 0) {
      for (const op of bulkOps) {
        await HaberModel.updateOne(
          op.updateOne.filter,
          op.updateOne.update,
          { upsert: true }
        );
      }
      
      console.log(`Veritabanı işlemi tamamlandı: ${bulkOps.length} haber işlendi`);
      
      return NextResponse.json({
        success: true,
        mesaj: 'Haberler başarıyla toplandı ve işlendi',
        toplam_haber: haberler.length,
        islenen_haber: islenmisDizi.length,
        veritabani_sonuc: {
          toplam_islenen: bulkOps.length
        }
      });
    } else {
      console.log('İşlenecek haber bulunamadı');
      return NextResponse.json(
        { 
          success: false, 
          message: 'İşlenecek haber bulunamadı' 
        }, 
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Crawler API hatası:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Haber toplama hatası: ${(error as Error).message}` 
      }, 
      { status: 500 }
    );
  }
} 