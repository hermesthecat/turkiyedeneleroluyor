import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);

// Uploads klasörünün yolu
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Uploads klasörünü oluşturur (yoksa)
 */
export async function ensureUploadsDir() {
  try {
    if (!await exists(UPLOADS_DIR)) {
      await mkdir(UPLOADS_DIR, { recursive: true });
      console.log('Uploads klasörü oluşturuldu');
    }
  } catch (error) {
    console.error('Uploads klasörü oluşturma hatası:', error);
    throw error;
  }
}

/**
 * Uploads klasöründeki tüm dosyaları temizler
 */
export async function cleanUploadsDir() {
  try {
    // Klasörün var olduğundan emin ol
    await ensureUploadsDir();

    // Klasördeki tüm dosyaları oku
    const files = await readdir(UPLOADS_DIR);
    console.log(`Uploads klasöründe ${files.length} dosya bulundu`);

    // Her dosyayı sil
    const deletePromises = files.map(file =>
      unlink(path.join(UPLOADS_DIR, file))
        .then(() => console.log(`Dosya silindi: ${file}`))
        .catch(err => console.error(`Dosya silme hatası (${file}):`, err))
    );

    await Promise.all(deletePromises);
    console.log('Tüm dosyalar temizlendi');
  } catch (error) {
    console.error('Uploads klasörünü temizleme hatası:', error);
    throw error;
  }
}

/**
 * URL'den görsel indirir ve uploads klasörüne kaydeder
 * @param imageUrl İndirilecek görselin URL'si
 * @param fileName Kaydedilecek dosya adı
 * @returns Görselin yerel URL'si (public/uploads içindeki)
 */
export async function downloadImage(imageUrl: string, fileName: string): Promise<string> {
  try {
    // Klasörün var olduğundan emin ol
    await ensureUploadsDir();

    // Dosya uzantısını belirle
    const extension = path.extname(imageUrl).split('?')[0] || '.jpg';

    // Tam dosya yolu
    const filePath = path.join(UPLOADS_DIR, `${fileName}${extension}`);
    const publicPath = `/uploads/${fileName}${extension}`;

    console.log(`Görsel indiriliyor: ${imageUrl}`);

    // Görseli indir
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'stream',
      timeout: 10000, // 10 saniye
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      }
    });

    // Dosyaya yaz
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`Görsel kaydedildi: ${filePath}`);
        resolve(publicPath);
      });

      writer.on('error', err => {
        console.error(`Görsel kaydetme hatası:`, err);
        reject(err);
      });
    });
  } catch (error) {
    console.error(`Görsel indirme hatası (${imageUrl}):`, error);
    return ''; // Hata durumunda boş döndür
  }
} 