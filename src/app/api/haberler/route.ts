import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/mongodb';
import HaberModel from '@/app/models/Haber';

export async function GET(request: NextRequest) {
  try {
    // Veritabanına bağlan
    await connectToDatabase();
    
    // Sorgu parametrelerini al
    const searchParams = request.nextUrl.searchParams;
    const limit = Number(searchParams.get('limit')) || 20;
    const skip = Number(searchParams.get('skip')) || 0;
    const sortBy = searchParams.get('sortBy') || 'yayinTarihi';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const kategori = searchParams.get('kategori') || null;
    
    // Sorgu oluştur
    const query: any = {};
    if (kategori) {
      query.kategori = kategori;
    }
    
    // Haberleri getir
    const haberler = await HaberModel.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Toplam sayıyı getir
    const total = await HaberModel.countDocuments(query);
    
    return NextResponse.json({
      haberler,
      total,
      limit,
      skip,
      success: true
    });
  } catch (error) {
    console.error('Haberler alınırken hata oluştu:', error);
    return NextResponse.json(
      { error: 'Haberler alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Tekil haber getirme için kullanılacak API
export async function POST(request: NextRequest) {
  try {
    // Veritabanına bağlan
    await connectToDatabase();
    
    // İstek gövdesini al
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Haber ID\'si belirtilmedi' },
        { status: 400 }
      );
    }
    
    // Haberi getir
    const haber = await HaberModel.findById(id).lean();
    
    if (!haber) {
      return NextResponse.json(
        { error: 'Haber bulunamadı' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      haber,
      success: true
    });
  } catch (error) {
    console.error('Haber alınırken hata oluştu:', error);
    return NextResponse.json(
      { error: 'Haber alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
} 