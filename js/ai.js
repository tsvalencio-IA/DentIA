// =====================================================================
// 🧠 MÓDULO IA: js/ai.js (COM SISTEMA DE RESGATE AUTOMÁTICO)
// =====================================================================
(function() {
    const config = window.AppConfig || {};
    const API_KEY = config.API_KEY;

    // Lista de modelos para tentar em ordem (se um falhar, tenta o próximo)
    // 1. Flash (Rápido) -> 2. Pro 1.5 (Inteligente) -> 3. Pro 1.0 (Antigo/Compatível)
    const MODELS_TO_TRY = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

    async function tryGenerate(modelName, systemPrompt, userMessage) {
        console.log(`🤖 Tentando conectar com modelo: ${modelName}...`);
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
        
        const finalPrompt = `
CONTEXTO DO SISTEMA:
${systemPrompt}
---
MENSAGEM DO USUÁRIO:
${userMessage}
        `.trim();

        const payload = {
            contents: [{ role: "user", parts: [{ text: finalPrompt }] }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || response.statusText);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Resposta vazia da IA.");
        }
    }

    async function callGeminiAPI(systemPrompt, userMessage) {
        if (!API_KEY || API_KEY.length < 10) {
            return "Erro: Chave API inválida ou não configurada.";
        }

        // Tenta os modelos em sequência até um funcionar
        for (let i = 0; i < MODELS_TO_TRY.length; i++) {
            const model = MODELS_TO_TRY[i];
            try {
                const result = await tryGenerate(model, systemPrompt, userMessage);
                return result; // Se funcionou, retorna e sai da função
            } catch (error) {
                console.warn(`⚠️ Falha no modelo ${model}:`, error.message);
                
                // Se foi o último modelo e falhou, retorna erro final
                if (i === MODELS_TO_TRY.length - 1) {
                    return `Erro fatal na IA: Não foi possível conectar com nenhum modelo. Verifique se sua Chave API permite o domínio atual (Referrers). Detalhe: ${error.message}`;
                }
                // Se não foi o último, o loop continua e tenta o próximo modelo
            }
        }
    }

    window.callGeminiAPI = callGeminiAPI;
})();
