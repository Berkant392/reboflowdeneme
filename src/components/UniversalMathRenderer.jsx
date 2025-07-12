import React, { useMemo } from 'react';
import KatexRenderer from './KatexRenderer';

const UniversalMathRenderer = ({ text }) => {
    const parsedContent = useMemo(() => {
        if (!text) return [];
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        return lines.map((line, lineIndex) => {
            // Regex, öncül başlıklarını da ayıracak şekilde güncellendi
            const parts = line.split(/(\*\*.*?\*\*|\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|1️⃣ I\. İfade:|2️⃣ II\. İfade:|3️⃣ III\. İfade:|4️⃣ IV\. İfade:|5️⃣ V\. İfade:)/g).filter(Boolean);
            const renderedParts = parts.map((part, partIndex) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={partIndex} className="font-bold text-gray-900 mr-1">{part.slice(2, -2)}</strong>;
                } else if (part.startsWith('$$') && part.endsWith('$$')) {
                    return <KatexRenderer key={partIndex} content={part.slice(2, -2)} isBlock={true} />;
                } else if (part.startsWith('$') && part.endsWith('$')) {
                    return <KatexRenderer key={partIndex} content={part.slice(1, -1)} isBlock={false} />;
                } else if (/^\d️⃣ /.test(part)) { // Regex, emojili başlıkları tanır
                     return <span key={partIndex} className="font-semibold text-gray-800 mr-1">{part}</span>;
                }
                else {
                    return <span key={partIndex}>{part}</span>;
                }
            });
            return <p key={lineIndex} className="mb-2 text-gray-700 leading-relaxed flex items-baseline flex-wrap">{renderedParts}</p>;
        });
    }, [text]);

    return <div>{parsedContent}</div>;
};

export default UniversalMathRenderer;
