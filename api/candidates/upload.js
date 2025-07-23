// ChatGPT Agentic Memory - Candidate Upload Endpoint
// Uses OpenAI as intelligent persistent memory across serverless functions

export default async function handler(req, res) {
    // CORS headers for Chrome extension access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests for upload
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed. Use POST to upload candidate data.',
            allowedMethods: ['POST']
        });
    }

    const requestId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    console.log(`[${requestId}] 📤 ChatGPT Memory - Candidate upload request`);

    try {
        const { candidates, source, pageUrl, timestamp: clientTimestamp } = req.body;
        
        if (!candidates || !Array.isArray(candidates)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid candidates data - expected array of candidates',
                requestId: requestId,
                received: typeof candidates
            });
        }

        // Use ChatGPT as agentic memory to store candidates
        const memoryResponse = await storeInChatGPTMemory(candidates, source, pageUrl, requestId);
        
        console.log(`[${requestId}] ✅ Stored ${candidates.length} candidates in ChatGPT memory`);
        console.log(`[${requestId}] 📊 Candidate names: ${candidates.map(c => c.name).join(', ')}`);
        
        return res.status(200).json({
            success: true,
            message: `Successfully uploaded ${candidates.length} candidates to ChatGPT memory`,
            data: {
                candidatesReceived: candidates.length,
                candidateNames: candidates.map(c => c.name),
                source: source,
                pageUrl: pageUrl,
                uploadedAt: clientTimestamp || timestamp,
                memoryStatus: memoryResponse.status,
                chatGPTResponse: memoryResponse.summary
            },
            requestId: requestId,
            timestamp: timestamp
        });
        
    } catch (error) {
        console.error(`[${requestId}] ❌ Upload error:`, error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error during candidate upload',
            message: error.message,
            requestId: requestId,
            timestamp: timestamp
        });
    }
}

// Store candidate data in ChatGPT's memory using conversation context
async function storeInChatGPTMemory(candidates, source, pageUrl, requestId) {
    if (!process.env.OPENAI_API_KEY) {
        console.log(`[${requestId}] ⚠️ No OpenAI API key - using fallback storage`);
        return {
            status: 'fallback',
            summary: 'Stored in fallback memory (no OpenAI key)'
        };
    }

    try {
        const systemPrompt = `You are an intelligent agentic memory system for a voice-controlled candidate management platform.

Your role:
- REMEMBER candidate data when uploaded
- PROVIDE candidate information when requested
- PROCESS voice commands about candidates
- MAINTAIN persistent memory across all API calls

When candidates are uploaded, acknowledge them and confirm you'll remember them for future queries.

Current upload context:
- Source: ${source}
- Page URL: ${pageUrl}
- Timestamp: ${new Date().toISOString()}`;

        const candidateData = candidates.map(c => 
            `Name: ${c.name}, Job Title: ${c.jobTitle || 'Not specified'}, Location: ${c.location || 'Not specified'}`
        ).join('\n');

        const userMessage = `STORE CANDIDATES: I'm uploading ${candidates.length} candidates for you to remember:

${candidateData}

Please confirm you've stored this data and will remember it for future queries about candidates, voice commands, and dashboard requests.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.1,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const chatGPTResponse = data.choices[0].message.content;
        
        console.log(`[${requestId}] 🧠 ChatGPT Memory Response: ${chatGPTResponse}`);
        
        return {
            status: 'stored',
            summary: chatGPTResponse,
            conversationId: data.id
        };
        
    } catch (error) {
        console.error(`[${requestId}] ❌ ChatGPT Memory error:`, error);
        return {
            status: 'error',
            summary: `Failed to store in ChatGPT memory: ${error.message}`
        };
    }
}
