// Bu dosya, API anahtarlarınızı güvende tutan sunucu tarafı kodudur.
// Tarayıcıda çalışmaz, sadece Netlify'ın sunucularında çalışır.

// API'ları çağırmak için bir fetch kütüphanesi gerekiyor
import fetch from 'node-fetch';

exports.handler = async (event) => {
  // Sadece POST isteklerine izin ver
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { imageBase64, subject, userAnswer, correctionText } = JSON.parse(event.body);
    
    // Güvenli ortam değişkenlerinden API anahtarlarını al
    const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
    const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;
    const ROBOFLOW_MODEL_URL = "https://detect.roboflow.com/geometric-shapes-5hwwu-typml/1";

    // 1. Roboflow ile Görsel Analizi (Opsiyonel)
    let roboflowAnalysisText = '';
    try {
        const roboUrl = `${ROBOFLOW_MODEL_URL}?api_key=${ROBOFLOW_API_KEY}`;
        const roboResponse = await fetch(roboUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: imageBase64
        });
        if (roboResponse.ok) {
            const data = await roboResponse.json();
            if (data.predictions && data.predictions.length > 0) {
                const summary = data.predictions.reduce((acc, pred) => {
                    acc[pred.class] = (acc[pred.class] || 0) + 1;
                    return acc;
                }, {});
                roboflowAnalysisText = Object.entries(summary)
                    .map(([key, value]) => `${value} adet '${key}'`)
                    .join(', ');
            }
        }
    } catch (e) {
        console.error("Roboflow analizi başarısız oldu:", e);
        // Bu hata kritik değil, Gemini devam edebilir.
    }

    // 2. Gemini için Prompt Oluşturma
    let prompt = `Sen, YKS ve lise müfredatına yüzde yüz hakim, ${subject} alanında uzman, analitik ve trigonometrik şekilleri, fonksiyon grafiklerini, koordinat düzlemlerini, renkleri ve konumları çok iyi yorumlayan bir yapay zeka öğretmenisin. Görevin, sana verilen tüm ipuçlarını kullanarak bir soruyu analiz etmek, basitleştirmek ve adım adım çözerek yüzde yüz doğru sonuca ulaşmaktır. Cevapların dilbilgisi açısından kusursuz olmalı ve **asla yazım yanlışı içermemelidir**.`;

    if (roboflowAnalysisText) {
        prompt += `\n\nİPUCU 1 (Görsel Analiz): Bir nesne tanıma modeli resimde şu nesneleri buldu: "${roboflowAnalysisText}". Bu bilgiyi sadece arka planda bir ipucu olarak kullan, kullanıcıya doğrudan gösterme.`;
    }

    if (userAnswer) {
        prompt += `\n\nİPUCU 2 (Doğru Cevap): Kullanıcı bu sorunun doğru cevabının "${userAnswer}" şıkkı olduğunu belirtti. Tüm mantığını ve çözüm adımlarını bu doğru cevaba ulaşacak şekilde kurmalısın.`;
    } else if (!correctionText) {
        prompt += `\n\nDİKKAT: Kullanıcı sorunun cevabını bilmiyor. Bu yüzden her zamankinden daha dikkatli olmalı, tüm adımlarını iki kez kontrol etmeli ve çözümünden kesinlikle emin olmalısın.`;
    }

    if (correctionText) {
        prompt += `\n\nİPUCU 3 (KULLANICI DÜZELTMESİ - EN YÜKSEK ÖNCELİK): Bir önceki çözümümün hatalı olduğunu belirten kullanıcı şu geri bildirimi verdi: "${correctionText}". Bu yeni bilgi en önemli ipucudur. Önceki analizini unut ve tüm mantığını bu kritik geri bildirime göre yeniden şekillendirerek soruyu en baştan çöz.`;
    }

    prompt += `\n\nGÖREVİN: Sana verilen tüm bu bilgiler ışığında, aşağıdaki 4 bölümü de eksiksiz ve istenen formatta doldurarak tek bir cevap metni oluştur. Cevabın MUTLAKA \`### Analiz\`, \`### Soruyu Basitleştirelim\`, \`### Çözüm\` ve \`### Tavsiyeler\` başlıklarını içermelidir.

**### Analiz**
Görseldeki en kritik bilgileri ve sorunun ne istediğini net bir şekilde belirt. Anlatımın sade, anlaşılır ve kısa maddeler halinde olsun. Göz korkutacak uzun paragraflardan kaçın. Her maddenin başına \`👉\` emojisi koy.

**### Soruyu Basitleştirelim**
Sorunun temel mantığını, bir lise öğrencisinin anlayacağı en basit dilde, "Aslında bu soru bizden şunu istiyor:" gibi bir başlangıçla, tek bir paragrafta yeniden ifade et.

**### Çözüm**
Soruyu adım adım, açık, anlaşılır ve lise müfredatına en uygun pratik yöntemle çöz. Her çözüm adımının başına sırasıyla şu emojilerden birini koy: \`🔵\`, \`🟢\`, \`🟡\`, \`🟠\`, \`🔴\`, \`🟣\`.
**Öncül Formatı:** Eğer soru öncüllü bir soru ise (I, II, III gibi ifadeler içeriyorsa), her bir öncülü şu formatta, dikkat çekici ve şık bir şekilde değerlendir: \`1️⃣ I. İfade:\` [Değerlendirme], \`2️⃣ II. İfade:\` [Değerlendirme]. Bu formatı birebir uygula.

**### Tavsiyeler**
Bu soruyla ilgili, öğrencinin gelecekte benzer soruları çözmesine yardımcı olacak 2-3 madde halinde, samimi bir öğretmen gibi tavsiyeler ver. Her tavsiyenin başına \`💡\` emojisi koy.

**FORMATLAMA KANUNLARI (ASLA İHLAL ETME):**
1.  **Başlıklar:** Başlıkların önüne ASLA numara veya madde işareti koyma. Sadece \`### Analiz\` gibi yaz.
2.  **Matematiksel Gösterim:** Tüm matematiksel ifadeler, denklemler, tek başına duran sayılar, değişkenler (x, y, N, a gibi) ve semboller **İSTİSNASIZ** bir şekilde tek dolar '$...$' veya çift dolar '$$...$$' arasına alınmalıdır.
3.  **Cümle Akışı Kanunu (EN ÖNEMLİ KURAL):** Matematiksel ifadeler cümlenin bir parçasıdır. Onları asla tırnak veya virgül ile ayırma. Metnin akıcı ve doğal olması kritiktir.
4.  **Türkçe Karakterler:** Türkçe kelimeleri (örneğin 'çift kök') ASLA dolar işareti içine alma.`;
    
    // 3. Gemini API Çağrısı
    const geminiPayload = { 
        contents: [{ 
            role: "user", 
            parts: [ { text: prompt }, { inlineData: { mimeType: "image/jpeg", data: imageBase64 } } ] 
        }] 
    };
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const geminiResponse = await fetch(geminiApiUrl, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(geminiPayload) 
    });

    if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        throw new Error(`Gemini API Hatası: ${geminiResponse.status} - ${errorText}`);
    }

    const result = await geminiResponse.json();
    const fullResult = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!fullResult) {
        const errorMessage = result.promptFeedback?.blockReason || JSON.stringify(result);
        throw new Error(`API'den geçerli bir yanıt alınamadı: ${errorMessage}`);
    }

    // 4. Yanıtı Ayrıştırma ve Geri Döndürme
    const parseSection = (text, startTag, endTag) => {
        const startIndex = text.indexOf(startTag);
        if (startIndex === -1) return '';
        const contentStartIndex = startIndex + startTag.length;
        if (endTag) {
            const endIndex = text.indexOf(endTag, contentStartIndex);
            if (endIndex !== -1) {
                return text.substring(contentStartIndex, endIndex).trim();
            }
        }
        return text.substring(contentStartIndex).trim();
    };

    const analysisText = parseSection(fullResult, '### Analiz', '### Soruyu Basitleştirelim');
    const simplificationText = parseSection(fullResult, '### Soruyu Basitleştirelim', '### Çözüm');
    const solutionText = parseSection(fullResult, '### Çözüm', '### Tavsiyeler');
    const recommendationsText = parseSection(fullResult, '### Tavsiyeler', null);

    return {
      statusCode: 200,
      body: JSON.stringify({
        analysis: analysisText,
        simplification: simplificationText,
        solution: solutionText,
        recommendations: recommendationsText,
      }),
    };

  } catch (error) {
    console.error('Sunucu fonksiyonunda hata:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
