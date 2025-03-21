'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TestCrawler() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedHaber, setSelectedHaber] = useState<any>(null);

  async function runCrawler() {
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedHaber(null);
    
    try {
      const response = await fetch('/api/crawl');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Bilinmeyen bir hata oluştu');
      }
      
      setResult(data);
      
      // Haber listesini ayrıca almak için
      if (data.haberler && data.haberler.length > 0) {
        // API'den tam haber bilgilerini al
        const fullDataResponse = await fetch('/api/haberler');
        const fullData = await fullDataResponse.json();
        
        if (fullDataResponse.ok && fullData.haberler) {
          // Tam haber listesini sonuca ekle
          setResult({
            ...data,
            fullHaberler: fullData.haberler
          });
        }
      }
    } catch (error: any) {
      console.error('Crawler hatası:', error);
      setError(error.message || 'Crawler çalıştırılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }
  
  function showHaberDetails(haber: any) {
    setSelectedHaber(haber);
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Crawler Test Sayfası</h1>
      
      <div className="mb-8">
        <button 
          onClick={runCrawler}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300"
        >
          {loading ? 'Çalışıyor...' : 'Crawler\'ı Çalıştır'}
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Bu işlem biraz zaman alabilir. Lütfen bekleyin...
        </p>
      </div>
      
      {loading && (
        <div className="animate-pulse p-4 bg-blue-50 rounded mb-4">
          <p className="font-medium">Crawler çalışıyor...</p>
          <p className="text-sm">Haberler çekiliyor, içerikleri işleniyor ve Gemini ile yeniden oluşturuluyor.</p>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded mb-4">
          <h3 className="text-red-600 font-bold">Hata!</h3>
          <p>{error}</p>
          {error.includes('404') && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-medium">Şu anda haber bulunamadı!</p>
              <p className="text-sm">Aşağıdaki sebeplerden dolayı haber bulunamıyor olabilir:</p>
              <ul className="list-disc pl-5 text-sm mt-1">
                <li>Haber kaynaklarına erişilemiyor olabilir</li>
                <li>Haber kaynaklarının yapısı değişmiş olabilir</li>
                <li>Sunucular geçici olarak çalışmıyor olabilir</li>
                <li>IP adresiniz engellenmiş olabilir</li>
              </ul>
              <p className="text-sm mt-2">Lütfen daha sonra tekrar deneyin.</p>
            </div>
          )}
        </div>
      )}
      
      {result && (
        <div className="bg-green-50 border border-green-200 p-4 rounded mb-6">
          <h2 className="text-xl font-bold text-green-700 mb-2">İşlem Tamamlandı!</h2>
          <p>{result.message}</p>
          
          {result.fullHaberler && result.fullHaberler.length > 0 && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">Son Eklenen Haberler:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.fullHaberler.map((haber: any, index: number) => (
                  <div 
                    key={haber._id || index} 
                    className="border bg-white p-3 rounded cursor-pointer hover:bg-blue-50"
                    onClick={() => showHaberDetails(haber)}
                  >
                    <p className="font-bold">{haber.baslik}</p>
                    <p className="text-sm text-gray-600">{haber.kaynak}</p>
                    <p className="text-xs">{new Date(haber.yayinTarihi).toLocaleString('tr-TR')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {selectedHaber && (
        <div className="border rounded-lg p-6 bg-white shadow-lg mb-8">
          <button 
            onClick={() => setSelectedHaber(null)}
            className="text-blue-600 mb-4 hover:underline"
          >
            ← Listeye Dön
          </button>
          
          <div className="mb-4">
            <h2 className="text-2xl font-bold">{selectedHaber.baslik}</h2>
            <p className="text-gray-600 italic mb-2">{selectedHaber.ozet}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedHaber.etiketler && selectedHaber.etiketler.map((etiket: string, i: number) => (
                <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {etiket}
                </span>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="font-bold mb-2">Haber İçeriği:</h3>
            <div 
              className="prose max-w-none" 
              dangerouslySetInnerHTML={{ __html: selectedHaber.icerik }}
            />
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Kaynak: {selectedHaber.kaynak}</p>
            <p>Kategori: {selectedHaber.kategori}</p>
            <p>Yayınlanma: {new Date(selectedHaber.yayinTarihi).toLocaleString('tr-TR')}</p>
            {selectedHaber.kaynak_url && (
              <a 
                href={selectedHaber.kaynak_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline"
              >
                Orijinal Habere Git
              </a>
            )}
          </div>
        </div>
      )}
      
      <div className="bg-blue-50 p-4 rounded mt-8">
        <h3 className="font-bold mb-2">Bilgi:</h3>
        <p>
          Bu sayfa, Crawler API'sini doğrudan çalıştırmanıza olanak tanır. 
          API çağrısı <code>/api/crawl</code> endpoint'ine yapılır ve şunları gerçekleştirir:
        </p>
        <ol className="list-decimal pl-6 mt-2 mb-2">
          <li>Haber kaynaklarından haberleri çeker</li>
          <li>Her haber için içerik alır</li>
          <li>Google Gemini API ile haberleri işler</li>
          <li>İşlenen haberleri veritabanına kaydeder</li>
        </ol>
        <p>Google Gemini API yaptığı işlemler:</p>
        <ul className="list-disc pl-6 mt-2">
          <li>Daha çarpıcı bir başlık oluşturur</li>
          <li>Merak uyandırıcı bir özet oluşturur</li>
          <li>İçeriği daha kapsamlı ve detaylı hale getirir</li>
          <li>İlgili etiketler üretir</li>
        </ul>
      </div>
    </div>
  );
} 