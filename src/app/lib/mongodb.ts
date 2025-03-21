import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/turkiyedeneleroluyor';

if (!MONGODB_URI) {
  throw new Error(
    'MongoDB URI bulunamadı. Lütfen .env dosyasında MONGODB_URI değişkenini tanımlayın.'
  );
}

console.log('MongoDB URI kontrolü yapıldı');

/**
 * Global değişken ile bağlantı durumunu takip ediyoruz
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose as MongooseCache;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  try {
    if (cached.conn) {
      console.log('Mevcut MongoDB bağlantısı kullanılıyor');
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000, // 5 saniye
        socketTimeoutMS: 45000, // 45 saniye
        family: 4 // IPv4
      };

      console.log('MongoDB bağlantısı başlatılıyor...');
      cached.promise = mongoose.connect(MONGODB_URI, opts)
        .then((mongoose) => {
          console.log('MongoDB bağlantısı başarılı!');
          return mongoose;
        })
        .catch((error) => {
          console.error('MongoDB bağlantı hatası:', error);
          cached.promise = null;
          throw error;
        });
    } else {
      console.log('Mevcut MongoDB bağlantı isteği bekleniyor...');
    }
    
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('MongoDB bağlantısı sırasında bir hata oluştu:', error);
    throw error;
  }
}

export default connectToDatabase; 