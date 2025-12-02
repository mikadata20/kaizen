
/**
 * Generates content for a work instruction manual step using Google Gemini API.
 * @param {string} taskName - The name of the task/step.
 * @param {string} apiKey - The Google Gemini API Key.
 * @param {string} model - The specific model to use (optional).
 * @returns {Promise<{description: string, keyPoints: string, safety: string}>}
 */
export const generateManualContent = async (taskName, apiKey, model = null) => {
    if (!apiKey) {
        throw new Error("API Key is missing.");
    }

    const prompt = `
        You are an industrial engineering expert creating a Work Instruction Manual.
        For the task "${taskName}", provide the following in JSON format ONLY:
        1. "description": A clear, concise, professional description of the action (max 2 sentences).
        2. "keyPoints": 2-3 critical quality or efficiency points (comma separated).
        3. "safety": 1-2 important safety or ergonomic warnings (comma separated).
        
        Example output format:
        {
            "description": "Pick up the part with the left hand and orient it for assembly.",
            "keyPoints": "Ensure firm grip, Check for burrs",
            "safety": "Wear gloves, Avoid sharp edges"
        }
    `;

    return await callGemini(prompt, apiKey, model);
};

/**
 * Improves existing content for grammar, clarity, and tone.
 * @param {object} content - { description, keyPoints, safety }
 * @param {string} apiKey - The Google Gemini API Key.
 * @param {string} model - The specific model to use (optional).
 * @returns {Promise<{description: string, keyPoints: string, safety: string}>}
 */
export const improveManualContent = async (content, apiKey, model = null) => {
    if (!apiKey) {
        throw new Error("API Key is missing.");
    }

    const prompt = `
        You are a grammar and spelling editor.
        
        CRITICAL RULES:
        1. **PRESERVE THE ORIGINAL LANGUAGE** - If input is in Indonesian, output MUST be in Indonesian. If English, output in English. NEVER translate.
        2. **ONLY FIX GRAMMAR AND SPELLING** - Do NOT add new information, details, or explanations
        3. **KEEP THE SAME LENGTH** - Do not make sentences longer or shorter
        4. **KEEP THE SAME MEANING** - Only fix errors, do not change the content
        5. Fix: capitalization, punctuation, spelling mistakes, grammar errors
        6. Do NOT add: extra words, technical terms, or additional details
        
        Input Data:
        Description: "${content.description || ''}"
        Key Points: "${content.keyPoints || ''}"
        Safety: "${content.safety || ''}"

        Output the corrected text (SAME LANGUAGE, SAME LENGTH, SAME MEANING) in JSON format:
        {
            "description": "Grammar-corrected description",
            "keyPoints": "Grammar-corrected key points",
            "safety": "Grammar-corrected safety"
        }
        
        If a field is empty, return it as empty string "".
    `;

    console.log('AI Improve Request:', { content, model });
    const result = await callGemini(prompt, apiKey, model);
    console.log('AI Improve Response:', result);
    return result;
};

/**
 * Validates the API Key and returns the list of available models.
 * @param {string} apiKey 
 * @returns {Promise<string[]>} List of available model names
 */
export const validateApiKey = async (apiKey) => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Failed to validate API Key");
        }

        const data = await response.json();
        if (!data.models) {
            return [];
        }

        // Filter for models that support generateContent
        return data.models
            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
            .map(m => m.name.replace('models/', ''));

    } catch (error) {
        console.error("API Validation Error:", error);
        throw error;
    }
};

/**
 * Chat with AI for Industrial Engineering analysis
 * @param {string} userMessage - User's question or message
 * @param {object} context - Measurement data context (elements, project info, etc.)
 * @param {array} chatHistory - Previous chat messages for context
 * @param {string} apiKey - The Google Gemini API Key
 * @param {string} model - The specific model to use (optional)
 * @returns {Promise<string>} AI response
 */
export const chatWithAI = async (userMessage, context = {}, chatHistory = [], apiKey, model = null) => {
    if (!apiKey) {
        throw new Error("API Key is missing.");
    }

    // Build context summary from measurement data
    let contextSummary = "";
    if (context.elements && context.elements.length > 0) {
        const totalTime = context.elements.reduce((sum, el) => sum + (el.duration || 0), 0);
        const elementList = context.elements.map((el, i) =>
            `${i + 1}. ${el.elementName || 'Unnamed'} (${el.therblig || 'N/A'}) - ${(el.duration || 0).toFixed(2)}s`
        ).join('\n');

        contextSummary = `
Current Measurement Data:
- Project: ${context.projectName || 'Unnamed Project'}
- Total Elements: ${context.elements.length}
- Total Cycle Time: ${totalTime.toFixed(2)} seconds
- Elements:
${elementList}
`;
    }

    // Build chat history context
    let historyContext = "";
    if (chatHistory.length > 0) {
        historyContext = "\n\nPrevious conversation:\n" +
            chatHistory.slice(-5).map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`).join('\n');
    }

    const prompt = `
        You are an expert Industrial Engineer specializing in:
        - Time and Motion Study
        - Work Measurement
        - Process Optimization
        - Lean Manufacturing
        - Ergonomics
        - Productivity Improvement
        
        ${contextSummary}
        ${historyContext}
        
        User Question: ${userMessage}
        
        Provide a helpful, professional response in the SAME LANGUAGE as the user's question.
        If the user asks in Indonesian, respond in Indonesian. If in English, respond in English.
        
        Your response should:
        - Be concise and actionable
        - Reference the measurement data when relevant
        - Provide specific recommendations based on Industrial Engineering principles
        - Use professional but understandable language
        
        Respond directly without JSON formatting.
    `;

    console.log('AI Chat Request:', { userMessage, context: contextSummary });

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to get AI response');
        }

        const data = await response.json();
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error("No response generated");
        }

        const aiResponse = data.candidates[0].content.parts[0].text;
        console.log('AI Chat Response:', aiResponse);
        return aiResponse;

    } catch (error) {
        console.error('AI Chat Error:', error);
        throw error;
    }
};

const callGemini = async (prompt, apiKey, specificModel = null) => {
    // If a specific model is provided, try only that one.
    // Otherwise, fallback to the list of stable models.
    const models = specificModel ? [specificModel] : ['gemini-1.5-flash', 'gemini-1.5-pro'];
    let lastError = null;

    for (const model of models) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 404 || response.status === 400) {
                    console.warn(`Model ${model} failed:`, errorData);
                    lastError = new Error(errorData.error?.message || `Model ${model} failed`);
                    continue;
                }
                throw new Error(errorData.error?.message || 'Failed to generate content');
            }

            const data = await response.json();
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error("No content generated");
            }
            let text = data.candidates[0].content.parts[0].text;

            // Clean up the text to remove markdown code blocks if present
            text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

            // Extract JSON from the text
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                let jsonText = jsonMatch[0];

                // Sanitize control characters in the JSON string
                // Replace problematic characters but preserve intentional newlines in values
                jsonText = jsonText
                    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '') // Remove control chars except \n, \r, \t
                    .replace(/\n/g, ' ') // Replace newlines with spaces
                    .replace(/\r/g, '') // Remove carriage returns
                    .replace(/\t/g, ' '); // Replace tabs with spaces

                try {
                    return JSON.parse(jsonText);
                } catch (e) {
                    console.error('JSON Parse Error:', e);
                    console.error('Problematic JSON:', jsonText);
                    throw new Error("Invalid JSON format from AI: " + e.message);
                }
            } else {
                // Try parsing the entire text as JSON
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error('Failed to parse AI response:', text);
                    throw new Error("Invalid response format from AI - no valid JSON found");
                }
            }

        } catch (error) {
            console.error(`AI Generation Error (${model}):`, error);
            lastError = error;
        }
    }

    throw lastError || new Error("AI generation failed. Please check your API Key and Model selection.");
};
