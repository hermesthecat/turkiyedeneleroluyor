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
  if (!apiKey || apiKey !== validApiKey) {
    console.log('Geçersiz API anahtarı ile erişim denemesi');
    return NextResponse.json(
      { 
        error: 'Geçersiz API anahtarı',
        message: 'API anahtarı eksik veya geçersiz. Lütfen geçerli bir API anahtarı sağlayın.' 
      }, 
      { status: 401 }
    );
  }
  
  try {
    console.log('Crawler başlatılıyor...');
    
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
      
      // Her bir haberi Gemini ile işle
      const islenmisPosts = await Promise.all(
        haberler.map(haber => processNewsWithGemini(haber as IHaber))
      );
      
      islenmisDizi = islenmisPosts.filter(Boolean) as IHaber[];
      console.log(`${islenmisDizi.length} haber başarıyla işlendi.`);
    } else {
      console.log('Gemini API anahtarı bulunamadı, haberler ham haliyle kaydedilecek.');
      islenmisDizi = haberler as IHaber[];
    }
    
    // MongoDB'ye bağlan
    console.log('Veritabanına bağlanılıyor...');
    await connectToDatabase();
    
    // Haberleri veritabanına ekle veya güncelle
    const bulkOps = islenmisDizi.map(haber => ({
      updateOne: {
        filter: { link: haber.link },
        update: { $set: { ...haber, son_guncelleme: new Date() } },
        upsert: true
      }
    }));
    
    if (bulkOps.length > 0) {
      const HaberModel = (await import('@/app/models/Haber')).default;
      
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