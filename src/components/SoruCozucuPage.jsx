import React, { useState, useRef } from 'react';
import UniversalMathRenderer from './UniversalMathRenderer';

const SoruCozucuPage = () => {
    const [image, setImage] = useState(null);
    const [imageBase64, setImageBase64] = useState('');
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [analysis, setAnalysis] = useState('');
    const [simplifiedQuestion, setSimplifiedQuestion] = useState('');
    const [solution, setSolution] = useState('');
    const [recommendations, setRecommendations] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');
    const [stage, setStage] = useState('upload'); 
    const [showFeedback, setShowFeedback] = useState(false);
    const [showReSolvePrompt, setShowReSolvePrompt] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const fileInputRef = useRef(null);
    const [userCorrectionText, setUserCorrectionText] = useState('');
    const correctionTextareaRef = useRef(null);

    const subjects = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'Edebiyat', 'Türkçe'];

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImage(URL.createObjectURL(file));
            resetSolutionState();
            setStage('image_uploaded');
            const reader = new FileReader();
            reader.onloadend = () => setImageBase64(reader.result.split(',')[1]);
            reader.onerror = () => setError('Dosya okunurken bir hata oluştu.');
            reader.readAsDataURL(file);
        }
    };

    const triggerFileSelect = () => fileInputRef.current?.click();

    const getSolutionFromServer = async (userAnswer, correctionText = null) => {
        if (!imageBase64 || !selectedSubject) {
            setError('Lütfen önce bir resim yükleyip ders seçin.');
            return;
        }
        
        setIsLoading(true);
        setLoadingMessage('İstek sunucuya gönderiliyor...');
        setError('');
        resetSolutionState(true);
        setStage('processing');

        try {
            const response = await fetch('/api/analyze-and-solve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageBase64,
                    subject: selectedSubject,
                    userAnswer,
                    correctionText,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Sunucudan bir hata geldi.');
            }

            const data = await response.json();
            
            setAnalysis(data.analysis || 'Analiz oluşturulamadı.');
            setSimplifiedQuestion(data.simplification || '');
            setSolution(data.solution || 'Çözüm oluşturulamadı.');
            setRecommendations(data.recommendations || '');
            
            setStage('solution_done');
            setShowFeedback(true);

        } catch (err) {
            setError(err.message);
            setStage('subject_selected');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReSolveWithCorrection = () => {
        setShowReSolvePrompt(false);
        getSolutionFromServer(null, userCorrectionText);
        setUserCorrectionText('');
    };

    const resetSolutionState = (keepSubject = false) => {
        setAnalysis(''); setSolution(''); setSimplifiedQuestion(''); setRecommendations('');
        setError(''); setShowFeedback(false); setShowReSolvePrompt(false); setFeedbackMessage('');
        if (!keepSubject) { setSelectedSubject(null); }
    };

    const resetApp = () => {
        setImage(null); setImageBase64(''); resetSolutionState(); setStage('upload');
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
            <header className="text-center mb-6">
                <div className="flex justify-center mb-4">
                    <div className="w-48 p-2 bg-white rounded-lg shadow-md">
                        <img 
                            src="https://i.ibb.co/pNPzLVX/Ads-z-tasar-m-2-1.jpg" 
                            alt="Halkalı Fen Bilimleri Merkezi Logosu" 
                            border="0"
                            className="rounded-md"
                        />
                    </div>
                </div>
                <p className="halkali-title text-lg font-semibold mb-2">Halkalı Fen Bilimleri Merkezi</p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">Soru Çözücü</h1>
                <p className="text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mt-2">Berkant Hoca</p>
            </header>
            
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">{error}</div>}
            
            <div className="flex flex-col gap-6">
                <div className="w-full flex flex-col items-center justify-center bg-gray-50 p-4 sm:p-6 rounded-lg border-2 border-dashed">
                    {image ? (
                        <div className="w-full text-center">
                            <img src={image} alt="Yüklenen Soru" className="max-w-full max-h-60 mx-auto rounded-lg shadow-md" />
                            <button onClick={resetApp} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Yeni Soru Yükle
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-8 cursor-pointer w-full" onClick={triggerFileSelect}>
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <p className="mt-2 text-sm font-medium text-gray-700">1. Adım: Fotoğraf Yükle</p>
                        </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                </div>
                
                {isLoading && <div className="mt-4 flex flex-col items-center justify-center"><div className="loader"></div><p className="text-gray-600 mt-2">{loadingMessage}</p></div>}
                {feedbackMessage && <div className="mt-4 p-3 text-center text-green-800 bg-green-100 rounded-lg">{feedbackMessage}</div>}

                {stage === 'image_uploaded' && (
                    <div className="w-full pt-4 border-t">
                        <h2 className="text-lg font-semibold text-center text-gray-700 mb-3">2. Adım: Dersi Seç</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                            {subjects.map(subject => (
                                <button key={subject} onClick={() => { setSelectedSubject(subject); setStage('subject_selected'); }} className={`py-2 px-3 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base ${selectedSubject === subject ? 'rainbow-active' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{subject}</button>
                            ))}
                        </div>
                    </div>
                )}

                {stage === 'subject_selected' && (
                    <div className="w-full pt-4 border-t text-center">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">3. Adım: Cevabı Seç ve Çözümü Başlat</h2>
                        <div className="flex justify-center items-center gap-3 flex-wrap">
                            {['A', 'B', 'C', 'D', 'E'].map((option, index) => {
                                const colors = ['bg-sky-500 hover:bg-sky-600', 'bg-emerald-500 hover:bg-emerald-600', 'bg-amber-500 hover:bg-amber-600', 'bg-rose-500 hover:bg-rose-600', 'bg-violet-500 hover:bg-violet-600'];
                                return (
                                    <button key={option} onClick={() => getSolutionFromServer(option)} disabled={isLoading} className={`answer-button w-12 h-12 flex items-center justify-center text-white font-bold text-lg rounded-full shadow-lg disabled:bg-gray-400 ${colors[index]}`}>
                                        {option}
                                    </button>
                                )
                            })}
                        </div>
                        <div className="mt-4">
                            <button onClick={() => getSolutionFromServer(null)} disabled={isLoading} className="answer-button w-full sm:w-auto px-6 py-2 border-2 border-gray-400 text-gray-600 font-semibold rounded-full hover:bg-gray-200 hover:border-gray-500 disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-300">
                                Cevabı Bilmiyorum / Şık Yok
                            </button>
                        </div>
                    </div>
                )}

                {(stage === 'solution_done') && (
                    <div className="space-y-8 mt-6 pt-6 border-t">
                        {analysis && <div className="bg-blue-50 p-4 sm:p-5 rounded-lg shadow-sm border border-blue-200"><h2 className="text-lg sm:text-xl font-bold text-blue-800 mb-3">Analiz</h2><UniversalMathRenderer text={analysis} /></div>}
                        {simplifiedQuestion && <div className="bg-yellow-50 p-4 sm:p-5 rounded-lg shadow-sm border border-yellow-200"><h2 className="text-lg sm:text-xl font-bold text-yellow-800 mb-3">Soruyu Basitleştirelim</h2><UniversalMathRenderer text={simplifiedQuestion} /></div>}
                        {solution && <div><h2 className="text-xl sm:text-2xl font-bold text-indigo-800 mb-4 text-center">Çözüm Adımları</h2><UniversalMathRenderer text={solution} /></div>}
                        {recommendations && <div className="mt-6"><h2 className="text-xl sm:text-2xl font-bold text-green-700 mb-4 text-center">💡 Sana Tavsiyeler</h2><div className="bg-green-100 p-4 sm:p-5 rounded-lg shadow-sm border border-green-300"><UniversalMathRenderer text={recommendations} /></div></div>}
                    </div>
                )}
                
                {showFeedback && (
                    <div className="mt-6 p-4 bg-purple-100 border border-purple-200 rounded-lg text-center">
                        <h3 className="font-semibold text-purple-800 mb-3">Çözümü Değerlendir</h3>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => { setFeedbackMessage("Geri bildiriminiz için teşekkürler!"); setShowFeedback(false); }} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
                                <span>👍</span> Beğendim
                            </button>
                            <button onClick={() => { setShowFeedback(false); setShowReSolvePrompt(true); }} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
                                <span>👎</span> Hatalı/Eksik
                            </button>
                        </div>
                    </div>
                )}
                
                {showReSolvePrompt && (
                     <div className="mt-6 p-5 text-center feedback-box">
                         <h3 className="font-semibold text-indigo-100 mb-2 text-lg">Çözümü Geliştirmeme Yardım Et</h3>
                         <p className="text-sm text-indigo-200 mb-4">Lütfen gözden kaçırdığım veya yanlış yorumladığım noktayı aşağıdaki kutucuğa yaz. Geri bildiriminle soruyu yeniden çözeceğim.</p>
                         <textarea 
                             ref={correctionTextareaRef}
                             className="w-full p-2 border bg-white text-gray-900 placeholder-gray-500 border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                             rows="3"
                             placeholder="Örn: Analizde üçgenin ikizkenar olduğunu belirtmemişsin..."
                             value={userCorrectionText}
                             onChange={(e) => setUserCorrectionText(e.target.value)}
                         ></textarea>
                         <div className="flex justify-center gap-4 mt-4">
                             <button onClick={handleReSolveWithCorrection} disabled={!userCorrectionText || isLoading} className="font-bold text-white px-4 py-2 rounded-lg transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-105 disabled:from-gray-400 disabled:to-gray-500 disabled:scale-100 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600">Gönder ve Yeniden Çöz</button>
                             <button onClick={() => setShowReSolvePrompt(false)} className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-all duration-300 ease-in-out">Vazgeç</button>
                         </div>
                     </div>
                )}
            </div>
        </div>
    );
};

export default SoruCozucuPage;
