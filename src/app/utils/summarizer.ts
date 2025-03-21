/**
 * Bu dosya, haberleri özetleme işlevselliğini sağlar.
 * Gelecekte bir AI API'si (OpenAI, Claude vb.) kullanılarak
 * daha gelişmiş özetleme yapılabilir.
 * 
 * Şu an için basit bir kelime sayısı temelli bir özetleme yapıyoruz.
 * 
 * @author A. Kerem Gök
 */

/**
 * Verilen HTML içeriğini düz metne dönüştürür
 */
export function htmlToText(html: string): string {
  if (!html) return '';
  
  try {
    // HTML etiketlerini kaldır
    let text = html.replace(/<[^>]*>/g, ' ');
    
    // Fazla boşlukları temizle
    text = text.replace(/\s+/g, ' ').trim();
    
    // HTML entity'leri dönüştür
    text = text.replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–');
    
    return text;
  } catch (error) {
    console.error('HTML metin dönüştürme hatası:', error);
    return '';
  }
}

/**
 * Metni cümlelere ayırır
 */
export function splitTextToSentences(text: string): string[] {
  if (!text) return [];
  
  // Cümlelere ayır
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  // Boş cümleleri filtrele
  return sentences.filter(sentence => sentence.trim().length > 0);
}

/**
 * Metni kelime sayısına göre özetler
 */
export function summarizeByWordCount(text: string, maxWords: number = 100): string {
  if (!text) return '';
  
  const sentences = splitTextToSentences(text);
  let wordCount = 0;
  let summary = [];
  
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/);
    wordCount += words.length;
    
    summary.push(sentence);
    
    if (wordCount >= maxWords) {
      break;
    }
  }
  
  return summary.join(' ');
}

/**
 * Metnin özetinin önemli kısımlarını çıkarır
 */
export function extractKeyPoints(text: string, maxPoints: number = 5): string[] {
  if (!text) return [];
  
  const sentences = splitTextToSentences(text);
  
  // Cümleleri önemlerine göre sıralama (basit bir yaklaşım)
  const scoredSentences = sentences.map(sentence => {
    // Önemli kelimeler veya ifadeler
    const importantTerms = [
      'önemli', 'kritik', 'büyük', 'başarı', 'kriz', 
      'açıkladı', 'duyurdu', 'bildirdi', 'belirtti',
      'ekonomi', 'hükümet', 'bakanlık', 'cumhurbaşkanı'
    ];
    
    let score = 0;
    
    // Cümle uzunluğuna göre puan ver (orta uzunluktaki cümleler daha önemli)
    const words = sentence.split(/\s+/).length;
    if (words > 5 && words < 20) {
      score += 2;
    }
    
    // Önemli terimleri içeriyorsa puan ver
    importantTerms.forEach(term => {
      if (sentence.toLowerCase().includes(term.toLowerCase())) {
        score += 3;
      }
    });
    
    // Sayıları içeriyorsa puan ver
    if (/\d+/.test(sentence)) {
      score += 2;
    }
    
    return { sentence, score };
  });
  
  // Puanlara göre sırala ve en önemli N tanesini al
  const keyPoints = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPoints)
    .map(item => item.sentence);
  
  return keyPoints;
}

/**
 * HTML içeriğini özetler
 */
export function summarizeHtmlContent(html: string, options = { maxWords: 150, maxPoints: 5 }): {
  summary: string;
  keyPoints: string[];
} {
  const plainText = htmlToText(html);
  
  if (!plainText) {
    return {
      summary: '',
      keyPoints: []
    };
  }
  
  const summary = summarizeByWordCount(plainText, options.maxWords);
  const keyPoints = extractKeyPoints(plainText, options.maxPoints);
  
  return {
    summary,
    keyPoints
  };
} 