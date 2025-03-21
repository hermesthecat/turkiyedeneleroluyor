import { NextRequest, NextResponse } from 'next/server';
import { tumKaynaklariCrawlEt, haberIcerikCek } from '@/app/utils/haberCrawler';
import connectToDatabase from '@/app/lib/mongodb';
import HaberModel from '@/app/models/Haber';
import { batchProcessNewsWithGemini } from '@/app/utils/geminiProcessor';

export async function GET(request: NextRequest) {
  try {
    // API anahtarı kontrolü
    const apiKey = request.nextUrl.searchParams.get('key');
    const correctApiKey = process.env.CRAWLER_API_KEY || 'gizli_api_anahtari';
    
    // API anahtarı kontrolü atlanabilir (geliştirme ortamı için)
    /*
    if (apiKey !== correctApiKey) {
      return NextResponse.json(
        { error: 'Geçersiz API anahtarı' },
        { status: 401 }
      );
    }
    */
    
    // 1. Veritabanına bağlan
    console.log('1. Veritabanına bağlanılıyor...');
    await connectToDatabase();
    console.log('2. Veritabanı bağlantısı başarılı');
    
    // 2. Tüm kaynaklardan haberleri çek
    console.log('3. Haber kaynakları taranıyor...');
    const haberler = await tumKaynaklariCrawlEt();
    console.log(`4. ${haberler.length} haber bulundu.`);
    
    if (haberler.length === 0) {
      console.log('5. Hiç haber bulunamadı');
      return NextResponse.json(
        { message: 'Hiç haber bulunamadı' },
        { status: 404 }
      );
    }
    
    // 3. Her haber için içerik çek
    console.log('5. Haberler için içerik çekiliyor...');
    for (const haber of haberler) {
      if (!haber.icerik && haber.kaynak_url) {
        const icerik = await haberIcerikCek(haber.kaynak_url);
        haber.icerik = icerik;
      }
    }
    
    // 4. Haberleri Gemini ile işle
    console.log('6. Haberler Gemini API ile işleniyor...');
    const processedHaberler = await batchProcessNewsWithGemini(haberler);
    console.log(`7. ${processedHaberler.length} haber işlendi.`);
    
    // 5. İşlenmiş haberleri veritabanına kaydet
    console.log('8. Haberler veritabanına kaydediliyor...');
    let saveCount = 0;
    for (const haber of processedHaberler) {
      try {
        // Başlık ve kaynak URL'e göre mevcut haberi kontrol et
        const existingHaber = await HaberModel.findOne({
          baslik: haber.baslik,
          kaynak_url: haber.kaynak_url
        });
        
        if (!existingHaber) {
          // Haber yoksa yeni ekle
          await HaberModel.create(haber);
          saveCount++;
        }
      } catch (error) {
        console.error('Haber kaydetme hatası:', error);
      }
    }
    
    console.log(`9. ${saveCount} yeni haber kaydedildi.`);
    
    return NextResponse.json({
      message: `${processedHaberler.length} haber bulundu, ${saveCount} yeni haber kaydedildi.`,
      haberler: processedHaberler.map(h => ({
        baslik: h.baslik,
        kaynak: h.kaynak,
        kaynak_url: h.kaynak_url
      }))
    });
    
  } catch (error) {
    console.error('Haber çekme işlemi sırasında bir hata oluştu:', error);
    return NextResponse.json(
      { error: 'Haber çekme işlemi sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
} 