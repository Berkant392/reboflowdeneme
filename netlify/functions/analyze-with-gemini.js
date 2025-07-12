// YENİ DOSYA: Bu fonksiyon, Gemini API anahtarını güvende tutar.
const fetch = require('node-fetch');

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Gemini API anahtarını Netlify'ın güvenli ortam değişkenlerinden al
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    // React'tan gelen prompt ve resim verisini al
    const { prompt, imageBase64 } = JSON.parse(event.body);

    if (!prompt || !imageBase64) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Eksik prompt veya resim verisi' }) };
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const payload = { 
        contents: [{ 
            role: "user", 
            parts: [ { text: prompt }, { inlineData: { mimeType: "image/jpeg", data: imageBase64 } } ] 
        }] 
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Gemini API Error:', result);
            return { statusCode: response.status, body: JSON.stringify({ error: result.error?.message || 'Gemini API tarafında bir hata oluştu.' }) };
        }
        
        if (result.candidates && result.candidates[0]?.content?.parts?.[0]) {
            return {
                statusCode: 200,
                body: JSON.stringify({ text: result.candidates[0].content.parts[0].text })
            };
        } else {
            return { statusCode: 500, body: JSON.stringify({ error: 'API\'den geçerli bir yanıt alınamadı.' }) };
        }

    } catch (error) {
        console.error('Netlify/Gemini function error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Fonksiyon çalıştırılırken bir hata oluştu.' }) };
    }
};
