import React, { useRef, useEffect } from 'react';
import katex from 'katex';

const KatexRenderer = ({ content, isBlock }) => {
    const katexRef = useRef(null);
    useEffect(() => {
        if (katexRef.current) {
            try {
                katex.render(content, katexRef.current, {
                    throwOnError: false,
                    displayMode: isBlock,
                });
            } catch (e) {
                katexRef.current.textContent = content;
            }
        }
    }, [content, isBlock]);
    return <span ref={katexRef} className={!isBlock ? 'inline-math' : ''}></span>;
};

export default KatexRenderer;
