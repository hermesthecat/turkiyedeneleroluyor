import { NextRequest, NextResponse } from 'next/server';
import { tumKaynaklariCrawlEt } from '@/app/utils/haberCrawler';
import { processNewsWithGemini } from '@/app/utils/geminiProcessor';
import connectToDatabase from '@/app/lib/mongodb';
import { cleanUploadsDir, downloadImage } from '@/app/utils/fileHelper';
import mongoose from 'mongoose';

export interface IHaber {
  baslik: string;
  link: string;  // Crawler'dan gelen haberler için link
  kaynak: string;
  tarih: string;
  icerik: string;
  ozetlendi: boolean;
  ozet?: string;
  kategori?: string;
  resim_url?: string;
  etiketler?: string[];
  kaynak_url?: string; // Mongoose için kaynak_url
  yayinTarihi?: Date;  // Veritabanında kullanılan tarih alanı
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

    // Uploads klasörünü temizle
    console.log('Uploads klasörü temizleniyor...');
    await cleanUploadsDir();

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
      const HaberModel = (await import('@/app/models/Haber')).default;

      // Her bir haberi sırayla işle ve hemen kaydet
      islenmisDizi = [];
      let islenmisSayisi = 0;

      for (const haber of haberler) {
        try {
          console.log(`Sıradaki haber işleniyor: "${haber.baslik?.substring(0, 30)}..."`);
          const islenmisPosts = await processNewsWithGemini(haber as IHaber);

          if (islenmisPosts) {
            // Haberi veritabanına kaydet
            let tarih;
            try {
              if ((haber as IHaber).tarih) {
                const tempDate = new Date((haber as IHaber).tarih);
                // Geçerli bir tarih mi kontrol et
                tarih = !isNaN(tempDate.getTime()) ? tempDate : new Date();
              } else {
                tarih = new Date();
              }
            } catch (error) {
              console.log(`Tarih dönüştürme hatası: ${error}. Şimdiki zaman kullanılıyor.`);
              tarih = new Date();
            }

            console.log(`Haber "${islenmisPosts.baslik?.substring(0, 30)}..." veritabanına kaydediliyor...`);

            try {
              // Resim indirme işlemi
              let localResimUrl = '';
              if (islenmisPosts.resim_url) {
                try {
                  // MongoDB'de yeni bir ObjectId oluştur
                  const fileId = new mongoose.Types.ObjectId().toString();
                  // Resmi indir
                  localResimUrl = await downloadImage(islenmisPosts.resim_url, fileId);
                  console.log(`Görsel indirildi: ${localResimUrl}`);
                } catch (imgError) {
                  console.error(`Görsel indirme hatası:`, imgError);
                  localResimUrl = '';
                }
              }

              // Debug: Link değerini kontrol et
              console.log(`HABER LINK KONTROL (${islenmisPosts.baslik?.substring(0, 20)}...): `, {
                orijinalLink: (haber as IHaber).link,
                islenmisPosts_link: (islenmisPosts as any).link,
                islenmisPosts_kaynak_url: (islenmisPosts as any).kaynak_url
              });

              // Link değerini garanti edelim
              const garantiLink = (haber as IHaber).link || (islenmisPosts as any).link || (islenmisPosts as any).kaynak_url || '';

              if (!garantiLink) {
                console.warn(`UYARI: ${islenmisPosts.baslik} haberi için link bilgisi bulunamadı!`);
              }

              // Haberi veritabanına kaydet
              const updateResult = await HaberModel.updateOne(
                {
                  kaynak_url: garantiLink,
                  baslik: islenmisPosts.baslik
                },
                {
                  $set: {
                    baslik: islenmisPosts.baslik,
                    ozet: islenmisPosts.ozet || `${islenmisPosts.baslik} hakkında detaylı bilgi için tıklayın.`,
                    icerik: islenmisPosts.icerik || '',
                    kaynak: islenmisPosts.kaynak || (haber as IHaber).kaynak,
                    kaynak_url: garantiLink,
                    resim_url: localResimUrl || islenmisPosts.resim_url || '',
                    kategori: islenmisPosts.kategori || 'Genel',
                    etiketler: islenmisPosts.etiketler || [],
                    yayinTarihi: tarih
                  }
                },
                { upsert: true }
              );

              islenmisSayisi++;
              console.log(`Haber başarıyla veritabanına kaydedildi. Toplam: ${islenmisSayisi}`);
              islenmisDizi.push(islenmisPosts as IHaber);
            } catch (dbError) {
              console.error(`Veritabanı kayıt hatası: ${dbError}`);
            }
          }
        } catch (error) {
          console.error(`Haber işleme hatası: ${error}`);
        }

        // Her istekten sonra kısa bir gecikme ekleyelim (rate limit'e takılmamak için)
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`${islenmisDizi.length} haber başarıyla işlendi ve veritabanına kaydedildi.`);

      return NextResponse.json({
        success: true,
        mesaj: 'Haberler başarıyla toplandı, işlendi ve kaydedildi',
        toplam_haber: haberler.length,
        islenen_haber: islenmisDizi.length,
        veritabani_sonuc: {
          toplam_islenen: islenmisSayisi
        }
      });
    } else {
      console.log('Gemini API anahtarı bulunamadı, haberler ham haliyle kaydedilecek.');
      islenmisDizi = haberler as IHaber[];

      // Haberleri veritabanına ekle veya güncelle
      const bulkOps = islenmisDizi.map(haber => {
        // Tarih kontrolü - geçerli tarih oluştur
        let tarih;
        try {
          if ((haber as IHaber).tarih) {
            const tempDate = new Date((haber as IHaber).tarih);
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
            filter: { kaynak_url: (haber as IHaber).link },
            update: {
              $set: {
                baslik: (haber as IHaber).baslik,
                ozet: (haber as IHaber).ozet || `${(haber as IHaber).baslik} hakkında detaylı bilgi için tıklayın.`,
                icerik: (haber as IHaber).icerik || '',
                kaynak: (haber as IHaber).kaynak,
                kaynak_url: (haber as IHaber).link,
                resim_url: (haber as IHaber).resim_url || '',
                kategori: (haber as IHaber).kategori || 'Genel',
                etiketler: [],
                yayinTarihi: tarih
              }
            },
            upsert: true
          }
        };
      });

      if (bulkOps.length > 0) {
        const HaberModel = (await import('@/app/models/Haber')).default;
        let kaydedilenSayisi = 0;

        for (const op of bulkOps) {
          try {
            // Resim indirme işlemi
            let localResimUrl = '';
            const haber = op.updateOne.update.$set;

            // Debug: Link değerini kontrol et (bulk işlem durumunda)
            console.log(`BULK HABER LINK KONTROL (${haber.baslik?.substring(0, 20)}...): `, {
              filter_kaynak_url: op.updateOne.filter.kaynak_url,
              haber_kaynak_url: haber.kaynak_url
            });

            // Link kontrolü
            if (!haber.kaynak_url) {
              console.warn(`UYARI: ${haber.baslik} haberi için kaynak_url bilgisi bulunamadı!`);
              // Filtre değerini kaynak_url olarak kullan
              haber.kaynak_url = op.updateOne.filter.kaynak_url || '';
            }

            if (haber.resim_url) {
              try {
                // MongoDB'de yeni bir ObjectId oluştur
                const fileId = new mongoose.Types.ObjectId().toString();
                // Resmi indir
                localResimUrl = await downloadImage(haber.resim_url, fileId);
                console.log(`Görsel indirildi: ${localResimUrl}`);

                // Yerel resim URL'sini güncelle
                if (localResimUrl) {
                  haber.resim_url = localResimUrl;
                }
              } catch (imgError) {
                console.error(`Görsel indirme hatası:`, imgError);
              }
            }

            await HaberModel.updateOne(
              op.updateOne.filter,
              op.updateOne.update,
              { upsert: true }
            );
            kaydedilenSayisi++;
          } catch (error) {
            console.error(`Veritabanı kayıt hatası: ${error}`);
          }
        }

        console.log(`Veritabanı işlemi tamamlandı: ${kaydedilenSayisi} haber işlendi`);

        return NextResponse.json({
          success: true,
          mesaj: 'Haberler başarıyla toplandı ve kaydedildi',
          toplam_haber: haberler.length,
          islenen_haber: islenmisDizi.length,
          veritabani_sonuc: {
            toplam_islenen: kaydedilenSayisi
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