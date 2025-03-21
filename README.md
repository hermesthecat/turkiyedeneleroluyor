# Türkiye'de Neler Oluyor

Türkiye'deki güncel haberleri toplayan, özetleyen ve modern bir arayüzle sunan Next.js web uygulaması.

## Proje Hakkında

Bu proje, çeşitli haber kaynaklarından haberleri otomatik olarak çeker, içeriği özetler ve kullanıcıya temiz bir arayüz sunar. Haberleri laf kalabalığından arındırarak, özü aktarma amacı güder.

## Özellikler

- Popüler haber kaynaklarından otomatik haber toplama
- Haberleri otomatik özetleme ve anahtar noktaları çıkarma
- Kategorilere göre haberleri filtreleme
- Responsive, modern arayüz
- Karanlık/Aydınlık tema desteği
- MongoDB veritabanı entegrasyonu

## Ekran Görüntüleri

![Ana Sayfa](https://picsum.photos/600/400)

## Teknolojiler

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Veritabanı**: MongoDB (Mongoose)
- **Diğer**: Axios (HTTP istekleri için), LinkedOM (HTML parsing için)

## Kurulum

### Gereksinimler

- Node.js (>= 16.0.0)
- NPM veya Yarn
- MongoDB veritabanı (yerel veya MongoDB Atlas)

### Adımlar

1. Repoyu klonlayın:
   ```bash
   git clone https://github.com/hermesthecat/turkiyedeneleroluyor.git
   cd turkiyedeneleroluyor
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Çevre değişkenleri için `.env.local` dosyası oluşturun:
   ```
   MONGODB_URI=mongodb://localhost:27017/turkiyedeneleroluyor
   CRAWLER_API_KEY=your_secret_api_key
   ```

4. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

5. Tarayıcıda http://localhost:3000 adresini açın.

## Haberleri Çekme ve Veritabanına Kaydetme

Haberleri manuel olarak çekmek ve veritabanına kaydetmek için `/api/crawl` endpoint'ini kullanabilirsiniz:

1. Geliştirme ortamında tarayıcıya şu adresi girin:
   ```
   http://localhost:3000/api/crawl
   ```

2. cURL ile istek göndermek için:
   ```bash
   curl -X GET http://localhost:3000/api/crawl -H "x-api-key: your_secret_api_key"
   ```

3. Düzenli olarak otomatik çekmek için `scripts/crawlScheduler.js` betiğini kullanabilirsiniz:
   ```bash
   node scripts/crawlScheduler.js
   ```

## Proje Yapısı

```
turkiyedeneleroluyor/
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── crawl/         # Haber çekme API'si
│   │   │   └── haberler/      # Haber listeleme API'si
│   │   ├── components/        # UI bileşenleri
│   │   ├── haber/             # Haber detay sayfası
│   │   ├── lib/               # Yardımcı fonksiyonlar
│   │   │   └── mongodb.js     # MongoDB bağlantısı
│   │   ├── models/            # Veritabanı modelleri
│   │   │   └── Haber.ts       # Haber modeli
│   │   ├── utils/             # Yardımcı araçlar
│   │   │   ├── haberCrawler.ts # Haber toplama aracı
│   │   │   └── summarizer.ts  # Haber özetleme aracı  
│   │   ├── globals.css        # Global CSS stilleri
│   │   ├── layout.tsx         # Ana sayfa layoutu
│   │   └── page.tsx           # Ana sayfa
│   └── scripts/
│       └── crawlScheduler.js  # Otomatik çekme için zamanlayıcı
├── .env.local                 # Çevre değişkenleri
├── next.config.js             # Next.js yapılandırması
├── package.json               # Proje bağımlılıkları
├── tailwind.config.js         # Tailwind yapılandırması
└── README.md                  # Bu dosya
```

## Geliştirme

### Yeni Haber Kaynağı Ekleme

`src/app/utils/haberCrawler.ts` dosyasındaki `kaynaklar` dizisine yeni kaynakları ekleyebilirsiniz:

```typescript
const kaynaklar: HaberKaynagi[] = [
  {
    name: 'YeniKaynak',
    url: 'https://www.yenikaynak.com/son-dakika/',
    baseUrl: 'https://www.yenikaynak.com',
    selectors: {
      articles: '.article-item',
      title: 'h2.title',
      summary: '.summary',
      link: 'a.link',
      image: 'img.image',
      category: '.category'
    }
  },
  // ...mevcut kaynaklar
];
```

### Özetleme Sistemini Geliştirme

Özetleme algoritması `src/app/utils/summarizer.ts` dosyasında bulunmaktadır. Daha gelişmiş özetleme için OpenAI veya başka bir AI API'si entegre edebilirsiniz.

## Katkıda Bulunma

1. Bu repoyu forklayın
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Muhteşem özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## İletişim

Geliştirici: A. Kerem Gök 