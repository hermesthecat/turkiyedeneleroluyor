import axios from 'axios';
import { parseHTML } from 'linkedom';
import { IHaber } from '@/app/models/Haber';

// Haber kaynağı tanımı
interface HaberKaynagi {
  url: string;
  name: string;
  selectors: {
    articles: string;
    title: string;
    summary: string;
    link: string;
    image: string;
    category: string;
  };
  baseUrl: string;
  requiresJavaScript?: boolean;
}

// Örnek haberler (fallback verileri)
const ornekHaberler: Partial<IHaber>[] = [
  {
    baslik: "Ekonomide yeni destek paketi açıklandı",
    ozet: "Hazine ve Maliye Bakanlığı tarafından hazırlanan yeni ekonomik destek paketi bugün açıklandı.",
    kaynak: "Ekonomi Haberleri",
    kaynak_url: "https://example.com/ekonomi-haberleri/1",
    resim_url: "https://picsum.photos/id/10/600/400",
    kategori: "Ekonomi",
    yayinTarihi: new Date(),
    icerik: "<p>Hazine ve Maliye Bakanlığı tarafından hazırlanan yeni ekonomik destek paketi bugün açıklandı. Paket kapsamında KOBİ'lere özel yeni teşvikler sunulacak.</p><p>Destek paketinin detayları şöyle:</p><ul><li>Vergi indirimleri</li><li>İstihdam destekleri</li><li>Düşük faizli krediler</li></ul>",
    etiketler: ["ekonomi", "destek paketi", "hazine", "maliye"]
  },
  {
    baslik: "Milli futbol takımı hazırlıklarını tamamladı",
    ozet: "A Milli Futbol Takımımız, yarın oynanacak kritik maç öncesi hazırlıklarını tamamladı.",
    kaynak: "Spor Haberleri",
    kaynak_url: "https://example.com/spor-haberleri/1",
    resim_url: "https://picsum.photos/id/20/600/400",
    kategori: "Spor",
    yayinTarihi: new Date(),
    icerik: "<p>A Milli Futbol Takımımız, yarın oynanacak kritik maç öncesi hazırlıklarını tamamladı. Teknik direktör, son taktik antrenmanında oyunculara özel talimatlar verdi.</p><p>Yarınki kadro şu şekilde olacak:</p><p>Kaleci: Altay Bayındır</p><p>Defans: Zeki, Merih, Ozan, Ferdi</p><p>Orta Saha: Okay, Orkun, Hakan</p><p>Forvet: Kerem, Cenk, Arda</p>",
    etiketler: ["milli takım", "futbol", "hazırlık", "maç"]
  },
  {
    baslik: "Meteoroloji'den kuvvetli yağış uyarısı",
    ozet: "Meteoroloji Genel Müdürlüğü, yurdun batı kesimlerinde kuvvetli yağış beklendiğini duyurdu.",
    kaynak: "Hava Durumu",
    kaynak_url: "https://example.com/hava-durumu/1",
    resim_url: "https://picsum.photos/id/30/600/400",
    kategori: "Gündem",
    yayinTarihi: new Date(),
    icerik: "<p>Meteoroloji Genel Müdürlüğü, yurdun batı kesimlerinde kuvvetli yağış beklendiğini duyurdu. Marmara ve Ege bölgelerinde etkili olacak yağışların sel ve su baskınlarına neden olabileceği belirtildi.</p><p>İstanbul için yarın saat 12:00'den itibaren sarı kodlu uyarı verildi. Vatandaşların tedbirli olması istendi.</p>",
    etiketler: ["meteoroloji", "yağış", "uyarı", "hava durumu"]
  },
  {
    baslik: "Eğitimde yeni dönem başlıyor",
    ozet: "Milli Eğitim Bakanı, önümüzdeki eğitim-öğretim yılında uygulanacak yeni sistemi tanıttı.",
    kaynak: "Eğitim Haberleri",
    kaynak_url: "https://example.com/egitim-haberleri/1",
    resim_url: "https://picsum.photos/id/40/600/400",
    kategori: "Eğitim",
    yayinTarihi: new Date(),
    icerik: "<p>Milli Eğitim Bakanı, önümüzdeki eğitim-öğretim yılında uygulanacak yeni sistemi tanıttı. Buna göre, okullarda yapay zeka destekli eğitim programları hayata geçirilecek.</p><p>Yeni sistemde öne çıkan yenilikler şöyle:</p><ul><li>Yapay zeka destekli öğrenme</li><li>Proje tabanlı değerlendirme</li><li>Sanal gerçeklik uygulamaları</li></ul>",
    etiketler: ["eğitim", "yeni dönem", "milli eğitim", "yapay zeka"]
  },
  {
    baslik: "Teknoloji devinden yeni akıllı telefon",
    ozet: "Popüler teknoloji şirketi, yeni amiral gemisi akıllı telefonunu bugün düzenlenen etkinlikle tanıttı.",
    kaynak: "Teknoloji Haberleri",
    kaynak_url: "https://example.com/teknoloji-haberleri/1",
    resim_url: "https://picsum.photos/id/50/600/400",
    kategori: "Teknoloji",
    yayinTarihi: new Date(),
    icerik: "<p>Popüler teknoloji şirketi, yeni amiral gemisi akıllı telefonunu bugün düzenlenen etkinlikle tanıttı. Yeni model, gelişmiş kamera özellikleri ve daha uzun pil ömrüyle dikkat çekiyor.</p><p>Cihazın teknik özellikleri şöyle:</p><ul><li>6.7 inç OLED ekran</li><li>48 MP ana kamera</li><li>4500 mAh batarya</li><li>8 GB RAM</li><li>128/256 GB depolama</li></ul>",
    etiketler: ["teknoloji", "akıllı telefon", "yeni model", "tanıtım"]
  }
];

// Haber kaynaklarını tanımlama - Temel selektörler
const kaynaklar: HaberKaynagi[] = [
  {
    name: 'Sözcü',
    url: 'https://www.sozcu.com.tr/son-dakika/',
    baseUrl: 'https://www.sozcu.com.tr',
    selectors: {
      articles: '.news-item, .timeline-card, article, .article, .card, [data-article-id], [class*="news"], [class*="article"]',
      title: 'h1, h2, h3, h4, .title, [class*="title"]',
      summary: 'p, .summary, .spot, .description, [class*="summary"], [class*="description"]',
      link: 'a',
      image: 'img',
      category: '.category, [class*="category"]'
    },
    requiresJavaScript: true
  },
  {
    name: 'Hürriyet',
    url: 'https://www.hurriyet.com.tr/son-dakika-haberleri/',
    baseUrl: 'https://www.hurriyet.com.tr',
    selectors: {
      articles: '.news-item, .article, article, .card, [data-article-id], [class*="news"], [class*="article"]',
      title: 'h1, h2, h3, h4, .title, [class*="title"]',
      summary: 'p, .summary, .spot, .description, [class*="summary"], [class*="description"]',
      link: 'a',
      image: 'img',
      category: '.category, [class*="category"]'
    },
    requiresJavaScript: true
  },
  {
    name: 'Milliyet',
    url: 'https://www.milliyet.com.tr/son-dakika/',
    baseUrl: 'https://www.milliyet.com.tr',
    selectors: {
      articles: '.news-item, article, .card, [data-article-id], [class*="news"], [class*="article"]',
      title: 'h1, h2, h3, h4, .title, [class*="title"]',
      summary: 'p, .summary, .spot, .description, [class*="summary"], [class*="description"]',
      link: 'a',
      image: 'img',
      category: '.category, [class*="category"]'
    },
    requiresJavaScript: true
  },
  {
    name: 'Haberler.com',
    url: 'https://www.haberler.com/son-dakika/',
    baseUrl: 'https://www.haberler.com',
    selectors: {
      articles: '.news-item, article, .card, [data-article-id], [class*="news"], [class*="article"]',
      title: 'h1, h2, h3, h4, .title, [class*="title"]',
      summary: 'p, .summary, .spot, .description, [class*="summary"], [class*="description"]',
      link: 'a',
      image: 'img',
      category: '.category, [class*="category"]'
    },
    requiresJavaScript: true
  }
];

/**
 * Verilen URL'den HTML içeriğini getirir
 */
async function fetchHTML(url: string): Promise<string> {
  try {
    console.log(`HTML getiriliyor: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr,en-US;q=0.7,en;q=0.3',
        'Referer': 'https://www.google.com/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      timeout: 15000, // 15 saniye timeout
    });
    return response.data;
  } catch (error) {
    console.error(`HTML getirme hatası: ${url}`, error);
    return '';
  }
}

/**
 * HTML içeriğini işleyerek haberleri çıkartır
 */
async function parseHaberler(html: string, kaynak: HaberKaynagi): Promise<Partial<IHaber>[]> {
  if (!html) {
    console.log(`${kaynak.name} için boş HTML döndü`);
    return [];
  }
  
  try {
    console.log(`${kaynak.name} için HTML ayrıştırılıyor`);
    const { document } = parseHTML(html);
    
    // HTML içeriğinin bir kısmını log'a yazdır
    const htmlPreview = html.slice(0, 500);
    console.log(`HTML Önizleme: ${htmlPreview}...`);
    
    // Tüm mevcut elementleri saydır
    console.log(`HTML'deki toplam element sayısı: ${document.querySelectorAll('*').length}`);
    
    // Spesifik arama yapalım
    console.log(`Tüm <a> etiketleri: ${document.querySelectorAll('a').length}`);
    console.log(`Tüm <div> etiketleri: ${document.querySelectorAll('div').length}`);
    console.log(`Tüm <article> etiketleri: ${document.querySelectorAll('article').length}`);
    
    // Çok sayıda potansiyel makale selektörünü deneyelim
    const potentialArticleSelectors = [
      'article', '[data-article-id]', '.news-item', '.article', '.card', '.news', '.tile',
      '[class*="news-item"]', '[class*="article"]', '[class*="card"]', '[class*="news"]',
      '.list-item', '.feed-item', '.entry', '.post', '.story', '.headline', '.media',
      'li.box', '.row a', '.grid-item', '.thumbnail', '.teaser', '.item', '.content-item'
    ];
    
    let bestSelector = '';
    let maxArticles = 0;
    
    for (const selector of potentialArticleSelectors) {
      try {
        const count = document.querySelectorAll(selector).length;
        if (count > maxArticles) {
          maxArticles = count;
          bestSelector = selector;
          console.log(`Yeni en iyi selektör: ${selector} (${count} öğe)`);
        }
      } catch (error: any) {
        console.error(`Selektör hatası (${selector}): ${error.message}`);
      }
    }
    
    console.log(`En çok öğe bulunan selektör: ${bestSelector} (${maxArticles} öğe)`);
    
    let articles;
    if (maxArticles > 0) {
      articles = document.querySelectorAll(bestSelector);
    } else {
      articles = document.querySelectorAll(kaynak.selectors.articles);
    }
    
    console.log(`${kaynak.name} için ${articles.length} haber bulundu`);
    
    const haberler: Partial<IHaber>[] = [];
    
    articles.forEach((article: any, index: number) => {
      try {
        if (index >= 10) return; // Sadece ilk 10 haberi al
        
        // Başlık elementleri
        const possibleTitleElements = [
          article.querySelector(kaynak.selectors.title),
          article.querySelector('h1'),
          article.querySelector('h2'),
          article.querySelector('h3'),
          article.querySelector('h4'),
          article.querySelector('[class*="title"]'),
          article.querySelector('[class*="headline"]'),
          article.querySelector('[class*="heading"]'),
          article.querySelector('b'),
          article.querySelector('strong')
        ].filter(Boolean);
        
        const titleElement = possibleTitleElements.length > 0 ? possibleTitleElements[0] : null;
        
        // Link elementleri
        const linkElement = article.querySelector('a') || 
                            article.closest('a') || 
                            Array.from(article.querySelectorAll('a')).find((a: Element) => (a as HTMLAnchorElement).href);
        
        // Özet elementleri
        const possibleSummaryElements = [
          article.querySelector(kaynak.selectors.summary),
          article.querySelector('p'),
          article.querySelector('[class*="summary"]'),
          article.querySelector('[class*="desc"]'),
          article.querySelector('[class*="spot"]'),
          article.querySelector('[class*="text"]'),
        ].filter(Boolean);
        
        const summaryElement = possibleSummaryElements.length > 0 ? possibleSummaryElements[0] : null;
        
        // Resim elementleri
        const imageElement = article.querySelector('img') || 
                             article.querySelector('[style*="background-image"]');
        
        // Kategori elementleri
        const categoryElement = article.querySelector(kaynak.selectors.category) || 
                               article.querySelector('[class*="category"]') ||
                               article.querySelector('[class*="tag"]');
        
        let titleText = '';
        if (titleElement) {
          titleText = titleElement.textContent?.trim() || '';
        }
        
        // Başlık bulunamadıysa ve link varsa, link metnini kullan
        if (!titleText && linkElement) {
          titleText = linkElement.textContent?.trim() || '';
        }
        
        // Hala başlık bulunamadıysa, indeks ile oluştur
        if (!titleText) {
          titleText = `${kaynak.name} Haber ${index + 1}`;
        }
        
        let link = '';
        if (linkElement) {
          link = linkElement.getAttribute('href') || '';
        }
        
        // Link göreceli ise mutlak URL oluştur
        if (link && !link.startsWith('http')) {
          link = `${kaynak.baseUrl}${link.startsWith('/') ? '' : '/'}${link}`;
        }
        
        // Link bulunamadıysa, kaynak ana sayfasını kullan
        if (!link) {
          link = kaynak.url;
        }
        
        const summary = summaryElement ? summaryElement.textContent?.trim() || '' : '';
        
        let image = '';
        if (imageElement) {
          image = imageElement.getAttribute('src') || imageElement.getAttribute('data-src') || '';
          // Background image durumunu kontrol et
          if (!image && imageElement.getAttribute('style')) {
            const styleMatch = imageElement.getAttribute('style')?.match(/background-image:\s*url\(['"]?([^'"()]+)['"]?\)/i);
            if (styleMatch && styleMatch[1]) {
              image = styleMatch[1];
            }
          }
        }
        
        // Resim göreceli ise mutlak URL oluştur
        if (image && !image.startsWith('http')) {
          image = `${kaynak.baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
        }
        
        // Resim bulunamadıysa, placeholder kullan
        if (!image) {
          image = `https://picsum.photos/id/${index + 1}/600/400`;
        }
        
        const category = categoryElement ? categoryElement.textContent?.trim() || 'Genel' : 'Genel';
        
        console.log(`Haber bulundu: "${titleText}" - ${link}`);
        
        haberler.push({
          baslik: titleText,
          ozet: summary || `${titleText} hakkında detaylı bilgi için tıklayın.`,
          kaynak: kaynak.name,
          kaynak_url: link,
          resim_url: image,
          kategori: category,
          yayinTarihi: new Date(),
          icerik: '', // İçerik ayrı olarak çekilecek
          etiketler: [category.toLowerCase()],
        });
      } catch (error) {
        console.error(`${kaynak.name} - Haber ayrıştırma hatası:`, error);
      }
    });
    
    if (haberler.length === 0) {
      console.log(`${kaynak.name} için haber bulunamadı, örnek haberler kullanılacak`);
      // Her kaynak için 1 tane örnek haber ekle
      const ornekHaber = ornekHaberler[Math.floor(Math.random() * ornekHaberler.length)];
      haberler.push({
        ...ornekHaber,
        baslik: `${ornekHaber.baslik} (${kaynak.name})`,
        kaynak: kaynak.name,
        yayinTarihi: new Date()
      });
    }
    
    return haberler;
  } catch (error) {
    console.error(`${kaynak.name} - HTML ayrıştırma hatası:`, error);
    return [];
  }
}

/**
 * Belirtilen kaynaktan haberleri çeker
 */
async function crawlKaynak(kaynak: HaberKaynagi): Promise<Partial<IHaber>[]> {
  try {
    console.log(`${kaynak.name} kaynağı taranıyor...`);
    const html = await fetchHTML(kaynak.url);
    if (!html) {
      console.log(`${kaynak.name} için HTML içeriği alınamadı, örnek haberler kullanılacak`);
      // HTML alınamadıysa örnek haber ekle
      return [{
        ...ornekHaberler[Math.floor(Math.random() * ornekHaberler.length)],
        baslik: `${ornekHaberler[0].baslik} (${kaynak.name})`,
        kaynak: kaynak.name,
        yayinTarihi: new Date()
      }];
    }
    
    return await parseHaberler(html, kaynak);
  } catch (error) {
    console.error(`${kaynak.name} - Kaynak tarama hatası:`, error);
    // Hata durumunda örnek haber ekle
    return [{
      ...ornekHaberler[Math.floor(Math.random() * ornekHaberler.length)],
      baslik: `${ornekHaberler[1].baslik} (${kaynak.name})`,
      kaynak: kaynak.name,
      yayinTarihi: new Date()
    }];
  }
}

/**
 * Tüm kaynaklardan haberleri çeker
 */
export async function tumKaynaklariCrawlEt(): Promise<Partial<IHaber>[]> {
  try {
    console.log(`${kaynaklar.length} kaynak taranacak`);
    const haberlerPromises = kaynaklar.map(kaynak => crawlKaynak(kaynak));
    const tumHaberlerArrays = await Promise.all(haberlerPromises);
    
    // Tüm kaynaklardan gelen haberleri birleştir
    const tumHaberler = tumHaberlerArrays.flat();
    console.log(`Toplam ${tumHaberler.length} haber bulundu`);
    
    // Hiç haber bulunamadıysa örnek haberleri kullan
    if (tumHaberler.length === 0) {
      console.log(`Hiç haber bulunamadı, örnek haberler kullanılacak`);
      return ornekHaberler;
    }
    
    return tumHaberler;
  } catch (error) {
    console.error('Tüm kaynakları tarama hatası:', error);
    // Hata durumunda örnek haberleri döndür
    console.log(`Hata nedeniyle örnek haberler kullanılacak`);
    return ornekHaberler;
  }
}

/**
 * Belirli bir haber bağlantısından haber içeriğini çeker
 */
export async function haberIcerikCek(url: string): Promise<string> {
  try {
    console.log(`İçerik çekiliyor: ${url}`);
    
    // Eğer örnek haber URL'si ise, örnek içerik döndür
    if (url.includes('example.com')) {
      console.log('Örnek haber URL tespit edildi, örnek içerik döndürülüyor');
      return `<p>Bu bir örnek haber içeriğidir.</p>
              <p>Haber kaynaklarından içerik çekilemediği durumlarda bu içerik gösterilmektedir.</p>
              <p>Haber kaynakları robot engelleme (anti-bot) sistemleri kullandığından içerik çekilememiş olabilir.</p>
              <p>Gerçek haberler için lütfen ilgili haber sitesini ziyaret edin.</p>`;
    }
    
    const html = await fetchHTML(url);
    if (!html) {
      console.log(`URL için HTML içeriği alınamadı: ${url}`);
      return '<p>İçerik yüklenemedi. Lütfen kaynağa giderek haberi okuyunuz.</p>';
    }
    
    const { document } = parseHTML(html);
    
    // Farklı sitelere göre içerik seçicileri - Genişletilmiş liste
    const contentSelectors = [
      // Genel içerik selektörleri
      '.news-content', '.article-content', '.content-text', '#article-body', 'article .content',
      '.detail-content', '.news-detail', '.article-body', '.news-text', '.entry-content',
      // Site spesifik selektörler
      '.news-detail__content', '.article__content', '.content-body', '.story-body', 
      '.newArticle-content', '.article-text', '.post-content', '.article-desc',
      '#main-article', '.main-content', '.story-content', '.content-article',
      // Daha genel selektörler
      'article', '.detail', '.article', '.news', '.content', 
      // En genel selektörler (son çare)
      '.container p', '#content p', 'main p'
    ];
    
    let content = '';
    
    // İçerik seçicileri deneme
    for (const selector of contentSelectors) {
      const contentElement = document.querySelector(selector);
      if (contentElement) {
        content = contentElement.innerHTML || '';
        console.log(`İçerik bulundu (${selector}): ${content.slice(0, 50)}...`);
        break;
      }
    }
    
    // Eğer içerik bulunamadıysa, tüm paragrafları topla
    if (!content) {
      console.log(`Selektör ile içerik bulunamadı, paragrafları topluyorum...`);
      const paragraphs = document.querySelectorAll('p');
      console.log(`${paragraphs.length} paragraf bulundu`);
      
      if (paragraphs.length > 0) {
        const paragraphsContent = Array.from(paragraphs)
          .filter(p => {
            const text = p.textContent?.trim() || '';
            return text.length > 30; // Sadece anlamlı uzunluktaki paragrafları al
          })
          .map(p => p.outerHTML)
          .join('');
        
        content = paragraphsContent;
        console.log(`Paragraflardan içerik oluşturuldu: ${content.slice(0, 50)}...`);
      }
    }
    
    if (!content) {
      console.log(`URL için içerik bulunamadı: ${url}`);
      return '<p>İçerik çekilemedi. Lütfen orijinal haber kaynağını ziyaret ediniz.</p>';
    }
    
    return content;
  } catch (error) {
    console.error('Haber içeriği çekme hatası:', error);
    return '<p>İçerik yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.</p>';
  }
} 