import mongoose, { Schema, Document, Model } from 'mongoose';

// Haber için TypeScript arayüzü
export interface IHaber extends Document {
  baslik: string;
  ozet: string;
  icerik: string;
  kaynak: string;
  kaynak_url: string;
  resim_url: string;
  kategori: string;
  etiketler: string[];
  yayinTarihi: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Haber için Mongoose şeması
const HaberSchema: Schema = new Schema(
  {
    baslik: { type: String, required: true },
    ozet: { type: String, required: true },
    icerik: { type: String, required: true },
    kaynak: { type: String, required: true },
    kaynak_url: { 
      type: String, 
      required: true,
      index: true // kaynak_url için index ekliyoruz
    },
    resim_url: { type: String, required: false },
    kategori: { type: String, required: true },
    etiketler: { type: [String], default: [] },
    yayinTarihi: { type: Date, required: true },
  },
  { timestamps: true }
);

// kaynak_url ve baslik kombinasyonu için bileşik unique index
HaberSchema.index({ kaynak_url: 1, baslik: 1 }, { unique: true });

// Mongoose modeli oluşturma veya varsa getirme
let HaberModel: Model<IHaber>;

try {
  // İlk kez çağrıldığında model oluşturulur
  HaberModel = mongoose.model<IHaber>('Haber');
} catch (error) {
  // Model zaten tanımlıysa, mevcut modeli kullanırız
  HaberModel = mongoose.model<IHaber>('Haber', HaberSchema);
}

export default HaberModel; 