import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import connectToDatabase from '@/app/lib/mongodb';
import HaberModel from '@/app/models/Haber';

// Veritabanından haber detayını getir
async function getHaberById(id: string) {
  try {
    await connectToDatabase();
    
    const haber = await HaberModel.findById(id).lean();
    
    if (!haber) {
      return null;
    }
    
    // Tarihleri string'e çevirmek için
    return JSON.parse(JSON.stringify(haber));
  } catch (error) {
    console.error('Haber detayı getirilirken hata:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const haber = await getHaberById(params.id);
  
  if (!haber) {
    return {
      title: 'Haber bulunamadı',
      description: 'Aradığınız haber bulunamadı'
    };
  }
  
  return {
    title: haber.baslik,
    description: haber.ozet,
  };
}

export default async function HaberDetay({ params }: { params: { id: string } }) {
  const haber = await getHaberById(params.id);
  
  if (!haber) {
    notFound();
  }
  
  // Veritabanında haber yok veya örnek haber getirmek için
  const ornekHaber = {
    id: '1',
    baslik: 'Ekonomi Bakanı enflasyon rakamlarını değerlendirdi',
    ozet: 'Ekonomi Bakanı, açıklanan enflasyon rakamlarının beklenenden daha iyi olduğunu ve ekonomik toparlanma sürecinin başladığını ifade etti.',
    icerik: `
    <p>Ekonomi Bakanı, bugün düzenlediği basın toplantısında açıklanan son enflasyon verilerini değerlendirdi. Bakan, enflasyon oranının geçen aya göre düşüş gösterdiğini ve bu düşüşün ekonomik toparlanma sürecinin başladığının işareti olduğunu vurguladı.</p>
    
    <p>"Uygulanan ekonomi politikalarının olumlu sonuçlarını görmeye başladık" diyen Bakan, "Enflasyonla mücadele kararlılıkla devam edecek ve bu konuda taviz vermeyeceğiz" ifadelerini kullandı.</p>
    
    <p>Bakanlığın yaptığı açıklamada, ekonomik göstergelerin büyümenin devam ettiğini gösterdiği, ancak enflasyonla mücadelenin ekonomi politikasının önceliği olmaya devam ettiği belirtildi.</p>
    
    <p>Merkez Bankası'nın aldığı kararların etkisiyle piyasalarda olumlu bir hava oluştuğunu ifade eden Bakan, yatırımcıların Türkiye'ye olan güveninin artmaya başladığını söyledi.</p>
    `,
    yayinTarihi: '2023-12-03',
    kategori: 'Ekonomi',
    kaynak: 'Anadolu Ajansı',
    resim_url: 'https://picsum.photos/800/400'
  };
  
  const gosterilecekHaber = haber || ornekHaber;
  
  return (
    <div>
      <Link href="/" className="text-primary hover:underline mb-4 inline-block">
        &larr; Ana Sayfaya Dön
      </Link>
      
      <article className="card">
        <div className="relative w-full h-64 mb-6">
          <Image 
            src={gosterilecekHaber.resim_url.startsWith('/uploads') 
              ? gosterilecekHaber.resim_url 
              : (gosterilecekHaber.resim_url || 'https://picsum.photos/800/400')}
            alt={gosterilecekHaber.baslik}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
            className="object-cover rounded-t-lg"
          />
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-accent font-semibold">{gosterilecekHaber.kategori}</span>
            <span className="text-sm text-gray-500">
              {new Date(gosterilecekHaber.yayinTarihi).toLocaleDateString('tr-TR')}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">{gosterilecekHaber.baslik}</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 font-medium mb-6">{gosterilecekHaber.ozet}</p>
          
          <div 
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: gosterilecekHaber.icerik }}
          />
          
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">Kaynak: {gosterilecekHaber.kaynak}</p>
          </div>
        </div>
      </article>
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Benzer Haberler</h2>
        <p className="text-gray-600 dark:text-gray-300">Benzer haberler yükleniyor...</p>
      </div>
    </div>
  );
} 