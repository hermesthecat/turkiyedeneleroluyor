import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import connectToDatabase from '@/app/lib/mongodb';
import HaberModel from '@/app/models/Haber';

async function getHaberler() {
  try {
    await connectToDatabase();
    
    // En son eklenen 6 haberi getir
    const haberler = await HaberModel.find({})
      .sort({ yayinTarihi: -1 })
      .limit(6)
      .lean();
    
    return JSON.parse(JSON.stringify(haberler)); // Dates etc. için serialization
  } catch (error) {
    console.error('Haberler getirilirken hata:', error);
    return []; // Hata durumunda boş dizi döndür
  }
}

export default async function Home() {
  // Veritabanından haberleri getir
  const haberler = await getHaberler();
  
  // Eğer veritabanında haber yoksa, örnek veriler göster
  const ornekHaberler = [
    {
      _id: '1',
      baslik: 'Ekonomi Bakanı enflasyon rakamlarını değerlendirdi',
      ozet: 'Ekonomi Bakanı, açıklanan enflasyon rakamlarının beklenenden daha iyi olduğunu ve ekonomik toparlanma sürecinin başladığını ifade etti.',
      yayinTarihi: '2023-12-03',
      kategori: 'Ekonomi',
      resim_url: 'https://picsum.photos/800/400'
    },
    {
      _id: '2',
      baslik: 'İstanbul\'da ulaşım ücretlerine zam',
      ozet: 'İstanbul Büyükşehir Belediyesi, toplu taşıma ücretlerine ocak ayından itibaren geçerli olmak üzere zam yapılacağını duyurdu.',
      yayinTarihi: '2023-12-02',
      kategori: 'Yerel',
      resim_url: 'https://picsum.photos/800/400'
    },
    {
      _id: '3',
      baslik: 'Milli takım Avrupa Şampiyonası\'nda gruplara kaldı',
      ozet: 'A Milli Futbol Takımı, elemelerdeki başarılı performansı ile Avrupa Şampiyonası\'nda grup aşamasına yükselmeyi başardı.',
      yayinTarihi: '2023-12-01',
      kategori: 'Spor',
      resim_url: 'https://picsum.photos/800/400'
    }
  ];
  
  // Gösterilecek haberleri seç (önce veritabanından, yoksa örnekler)
  const gosterilecekHaberler = haberler.length > 0 ? haberler : ornekHaberler;

  return (
    <div>
      <section className="mb-10">
        <h2 className="text-3xl font-bold mb-6">Son Haberler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gosterilecekHaberler.map((haber) => (
            <article key={haber._id} className="card hover:shadow-lg transition-shadow">
              <div className="relative w-full h-48 mb-4">
                <Image 
                  src={haber.resim_url || 'https://picsum.photos/800/400'}
                  alt={haber.baslik}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover rounded-t-lg"
                />
              </div>
              <div className="p-4">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">{haber.kategori}</span>
                <h3 className="text-xl font-bold mt-2 mb-3">{haber.baslik}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{haber.ozet}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {new Date(haber.yayinTarihi).toLocaleDateString('tr-TR')}
                  </span>
                  <Link href={`/haber/${haber._id}`}>
                    <span className="btn text-sm">Devamını Oku</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      
      <section>
        <div className="card p-6 bg-primary bg-opacity-10">
          <h2 className="text-2xl font-bold mb-4">Bültenimize Abone Olun</h2>
          <p className="mb-4">Türkiye'deki gelişmelerden anında haberdar olmak için bültenimize abone olun.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input 
              type="email" 
              placeholder="E-posta adresinizi girin" 
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button className="btn">Abone Ol</button>
          </div>
        </div>
      </section>
    </div>
  )
} 