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
export async function parseHaberler(html: string, kaynak: HaberKaynagi): Promise<Partial<IHaber>[]> {
  console.log(`${kaynak.name} için HTML işleniyor...`);
  
  if (!html || html.trim() === '') {
    console.log(`${kaynak.name} için boş HTML içeriği. İşlem atlanıyor.`);
    return [];
  }

  try {
    const dom = parseHTML(html);
    const document = dom.window.document;
    
    let articleElements: Element[] = [];
    
    // Selectorların bir array olmasını sağla ve her birini dene
    const selectors = Array.isArray(kaynak.selectors.articles) ? kaynak.selectors.articles : [kaynak.selectors.articles];
    
    // Her selector'ı dene ve en fazla sonuç vereni kullan
    for (const selector of selectors) {
      console.log(`${kaynak.name} için "${selector}" selector'ı deneniyor...`);
      const elements = document.querySelectorAll(selector);
      console.log(`${selector} selector'ı ile ${elements.length} element bulundu.`);
      
      if (elements.length > articleElements.length) {
        articleElements = Array.from(elements);
      }
    }
    
    if (articleElements.length === 0) {
      console.log(`${kaynak.name} kaynağında haber bulunamadı.`);
      return [];
    }
    
    console.log(`${kaynak.name} kaynağında ${articleElements.length} potansiyel haber bulundu.`);
    
    // En fazla 10 haber al
    const limitedArticles = articleElements.slice(0, 10);
    
    const haberler: Partial<IHaber>[] = [];
    
    for (const article of limitedArticles) {
      try {
        // Title bulmak için farklı stratejiler dene
        let title = '';
        if (kaynak.selectors.title) {
          const titleSelectors = Array.isArray(kaynak.selectors.title) ? kaynak.selectors.title : [kaynak.selectors.title];
          
          for (const titleSelector of titleSelectors) {
            const titleElement = article.querySelector(titleSelector);
            if (titleElement && titleElement.textContent) {
              title = titleElement.textContent.trim();
              break;
            }
          }
        }
        
        // Title hala bulunamadıysa, alternatif yöntemler dene
        if (!title) {
          // h1, h2, h3, h4 etiketlerini kontrol et
          for (const tag of ['h1', 'h2', 'h3', 'h4']) {
            const element = article.querySelector(tag);
            if (element && element.textContent) {
              title = element.textContent.trim();
              break;
            }
          }
          
          // Hala bulunamadıysa, article etiketinin kendisinin textContent'ini kullan
          if (!title && article.textContent) {
            title = article.textContent.trim().substring(0, 100);
          }
        }
        
        if (!title) {
          console.log('Başlık bulunamadı, bu haberi atlıyorum.');
          continue;
        }
        
        // Link bulmak için farklı stratejiler dene
        let link = '';
        
        // 1. Direkt article üzerinde a etiketi varsa
        const anchorElement = article.querySelector('a');
        if (anchorElement) {
          const hrefAttr = anchorElement.getAttribute('href');
          if (hrefAttr) {
            link = hrefAttr;
          }
        }
        
        // 2. Link selector varsa kullan
        if (!link && kaynak.selectors.link) {
          const linkSelectors = Array.isArray(kaynak.selectors.link) ? kaynak.selectors.link : [kaynak.selectors.link];
          
          for (const linkSelector of linkSelectors) {
            const linkElement = article.querySelector(linkSelector);
            if (linkElement) {
              const hrefAttr = linkElement.getAttribute('href');
              if (hrefAttr) {
                link = hrefAttr;
                break;
              }
            }
          }
        }
        
        // 3. Tüm a etiketlerini tara ve ilk geçerli hrefe sahip olanı kullan
        if (!link) {
          const allAnchors = article.querySelectorAll('a');
          for (let i = 0; i < allAnchors.length; i++) {
            const anchor = allAnchors[i];
            const hrefAttr = anchor.getAttribute('href');
            if (hrefAttr) {
              link = hrefAttr;
              break;
            }
          }
        }
        
        if (!link) {
          console.log('Link bulunamadı, bu haberi atlıyorum.');
          continue;
        }
        
        // Link'i tam URL'ye dönüştür
        if (link.startsWith('/')) {
          // Göreceli URL ise, tam URL'ye dönüştür
          const baseUrl = new URL(kaynak.baseUrl);
          link = `${baseUrl.protocol}//${baseUrl.hostname}${link}`;
        } else if (!link.startsWith('http')) {
          // Protokol belirtilmemişse, tam URL'ye dönüştür
          link = `https://${link}`;
        }
        
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
        
        let summary = '';
        if (summaryElement) {
          summary = summaryElement.textContent?.trim() || '';
        }
        
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
          image = `https://picsum.photos/id/${Math.floor(Math.random() * 100) + 1}/600/400`;
        }
        
        const category = categoryElement ? categoryElement.textContent?.trim() || 'Genel' : 'Genel';
        
        console.log(`Haber bulundu: "${title}" - ${link}`);
        
        haberler.push({
          baslik: title,
          ozet: summary || `${title} hakkında detaylı bilgi için tıklayın.`,
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
    }
    
    if (haberler.length === 0) {
      console.log(`${kaynak.name} için haber bulunamadı`);
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
      console.log(`${kaynak.name} için HTML içeriği alınamadı`);
      return [];
    }
    
    return await parseHaberler(html, kaynak);
  } catch (error) {
    console.error(`${kaynak.name} - Kaynak tarama hatası:`, error);
    return [];
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
    
    return tumHaberler;
  } catch (error) {
    console.error('Tüm kaynakları tarama hatası:', error);
    return [];
  }
}

/**
 * Belirli bir haber bağlantısından haber içeriğini çeker
 */
export async function haberIcerikCek(url: string): Promise<string> {
  try {
    console.log(`İçerik çekiliyor: ${url}`);
    
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