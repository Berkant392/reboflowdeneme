// Bu dosya, API anahtarlarımızı güvende tutan bir aracı görevi görür.
// Node.js ortamında çalışır.
const fetch = require('node-fetch');

exports.handler = async function(event) {
    // Sadece POST isteklerine izin ver
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // API anahtarlarını Netlify'ın güvenli ortam değişkenlerinden al
    const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;
    const ROBOFLOW_MODEL_URL = process.env.ROBOFLOW_MODEL_URL;

    // React uygulamasından gönderilen resim verisini al
    const { imageBase64 } = JSON.parse(event.body);

    if (!imageBase64) {
        return { statusCode: 400, body: 'Missing image data' };
    }

    const url = `${ROBOFLOW_MODEL_URL}?api_key=${ROBOFLOW_API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: imageBase64
        });

        const data = await response.json();

        // Başarılı olursa, sonucu React uygulamasına geri gönder
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Roboflow function error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Roboflow API call failed' }) };
    }
};
