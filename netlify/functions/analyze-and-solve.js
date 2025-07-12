const fetch = require('node-fetch');

// Helper function to call Roboflow API
async function analyzeImageWithRoboflow(base64Image, apiKey, modelUrl) {
    const url = `${modelUrl}?api_key=${apiKey}`;
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: base64Image
        });
        if (!response.ok) {
            console.error("Roboflow API Error:", await response.text());
            return null;
        }
        const data = await response.json();
        if (data.predictions && data.predictions.length > 0) {
            const summary = data.predictions.reduce((acc, pred) => {
                acc[pred.class] = (acc[pred.class] || 0) + 1;
                return acc;
            }, {});
            return Object.entries(summary)
                .map(([key, value]) => `${value} adet '${key}'`)
                .join(', ');
        }
        return null;
    } catch (error) {
        console.error("Roboflow analizi başarısız oldu:", error);
        return null; 
    }
}

// Helper function to call Gemini API
async function callGeminiAPI(prompt, imageBase64, apiKey) {
    const payload = { 
        contents: [{ 
            role: "user", 
            parts: [ { text: prompt }, { inlineData: { mimeType: "image/jpeg", data: imageBase64 } } ] 
        }] 
    };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    try {
        const response = await fetch(apiUrl, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error?.message || `Gemini API hatası: ${response.status}`);
        }
        if (result.candidates && result.candidates[0]?.content?.parts?.[0]) {
            return result.candidates[0].content.parts[0].text;
        }
        throw new Error(result.promptFeedback?.blockReason || "API'den geçerli bir yanıt alınamadı.");
    } catch (err) {
        console.error("Gemini API Error:", err);
        throw err; // Hatanın yukarıya iletilmesi için yeniden fırlat
    }
}

// Main Netlify Function handler
exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { imageBase64, subject, userAnswer } = JSON.parse(event.body);
        const { ROBOFLOW_API_KEY, ROBOFLOW_MODEL_URL, GEMINI_API_KEY } = process.env;

        if (!imageBase64 || !subject) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Resim veya ders bilgisi eksik.' }) };
        }

        // 1. Roboflow ile ön analiz yap
        const roboflowAnalysisText = await analyzeImageWithRoboflow(imageBase64, ROBOFLOW_API_KEY, ROBOFLOW_MODEL_URL);

        // 2. Gemini için detaylı prompt oluştur
        let prompt = `Sen, YKS ve lise müfredatına yüzde yüz hakim, ${subject} alanında uzman, analitik ve trigonometrik şekilleri, fonksiyon grafiklerini, koordinat düzlemlerini, renkleri ve konumları çok iyi yorumlayan bir yapay zeka öğretmenisin. Görevin, sana verilen tüm ipuçlarını kullanarak bir soruyu analiz etmek, basitleştirmek ve adım adım çözerek yüzde yüz doğru sonuca ulaşmaktır.`;

        if (roboflowAnalysisText) {
            prompt += `\n\nİPUCU 1 (Görsel Analiz): Bir nesne tanıma modeli resimde şu nesneleri buldu: "${roboflowAnalysisText}". Bu bilgiyi sadece arka planda bir ipucu olarak kullan, kullanıcıya doğrudan gösterme.`;
        }
        if (userAnswer) {
            prompt += `\n\nİPUCU 2 (En Önemli İpucu): Kullanıcı bu sorunun doğru cevabının "${userAnswer}" şıkkı olduğunu belirtti. Tüm mantığını ve çözüm adımlarını bu doğru cevaba ulaşacak şekilde kurmalısın.`;
        } else {
            prompt += `\n\nDİKKAT: Kullanıcı sorunun cevabını bilmiyor. Bu yüzden her zamankinden daha dikkatli olmalı, tüm adımlarını iki kez kontrol etmeli ve çözümünden kesinlikle emin olmalısın.`;
        }

        prompt += `\n\nGÖREVİN: Sana verilen tüm bu bilgiler ışığında, aşağıdaki 4 bölümü de eksiksiz ve istenen formatta doldurarak tek bir cevap metni oluştur. Cevabın MUTLAKA \`### Analiz\`, \`### Soruyu Basitleştirelim\`, \`### Çözüm\` ve \`### Tavsiyeler\` başlıklarını içermelidir.

**### Analiz**
Görseldeki en kritik bilgileri ve sorunun ne istediğini net bir şekilde belirt. Anlatımın sade, anlaşılır ve kısa maddeler halinde olsun. Göz korkutacak uzun paragraflardan kaçın. Her maddenin başına \`👉\` emojisi koy.

**### Soruyu Basitleştirelim**
Sorunun temel mantığını, bir lise öğrencisinin anlayacağı en basit dilde, "Aslında bu soru bizden şunu istiyor:" gibi bir başlangıçla, tek bir paragrafta yeniden ifade et.

**### Çözüm**
Soruyu adım adım, açık, anlaşılır ve lise müfredatına en uygun pratik yöntemle çöz. Her çözüm adımının başına sırasıyla şu emojilerden birini koy: \`🔵\`, \`🟢\`, \`🟡\`, \`🟠\`, \`🔴\`, \`🟣\`. Çözüm adımlarını cümle akışını bozmayacak şekilde, doğal bir dille yaz.

**### Tavsiyeler**
Bu soruyla ilgili, öğrencinin gelecekte benzer soruları çözmesine yardımcı olacak 2-3 madde halinde, samimi bir öğretmen gibi tavsiyeler ver. Her tavsiyenin başına \`💡\` emojisi koy.

**FORMATLAMA KANUNLARI (ASLA İHLAL ETME):**
1.  **Başlıklar:** Başlıkların önüne ASLA numara veya madde işareti koyma. Sadece \`### Analiz\` gibi yaz.
2.  **Matematiksel Gösterim:** Tüm matematiksel ifadeler, denklemler, tek başına duran sayılar, değişkenler (x, y, N, a gibi) ve semboller **İSTİSNASIZ** bir şekilde tek dolar '$...$' veya çift dolar '$$...$$' arasına alınmalıdır.
3.  **Cümle Akışı Kanunu (EN ÖNEMLİ KURAL):** Matematiksel ifadeler cümlenin bir parçasıdır. Onları asla tırnak veya virgül ile ayırma. Metnin akıcı ve doğal olması kritiktir.
    * **KESİNLİKLE YANLIŞ:** ...ve sonra, \`'$N-3$'\`, yeni değer olur.
    * **TAMAMEN DOĞRU:** ...ve sonra \`$N-3$\` yeni değer olur.
4.  **Türkçe Karakterler:** Türkçe kelimeleri (örneğin 'çift kök') ASLA dolar işareti içine alma.`;

        // 3. Gemini API'sini çağır
        const fullResult = await callGeminiAPI(prompt, imageBase64, GEMINI_API_KEY);

        // 4. Sonucu parçala ve geri döndür
        const parseSection = (text, startTag, endTag) => {
            const startIndex = text.indexOf(startTag);
            if (startIndex === -1) return '';
            const contentStartIndex = startIndex + startTag.length;
            if (endTag) {
                const endIndex = text.indexOf(endTag, contentStartIndex);
                if (endIndex !== -1) return text.substring(contentStartIndex, endIndex).trim();
            }
            return text.substring(contentStartIndex).trim();
        };

        const analysis = parseSection(fullResult, '### Analiz', '### Soruyu Basitleştirelim');
        const simplification = parseSection(fullResult, '### Soruyu Basitleştirelim', '### Çözüm');
        const solution = parseSection(fullResult, '### Çözüm', '### Tavsiyeler');
        const recommendations = parseSection(fullResult, '### Tavsiyeler', null);

        return {
            statusCode: 200,
            body: JSON.stringify({ analysis, simplification, solution, recommendations })
        };

    } catch (error) {
        console.error('Netlify function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
