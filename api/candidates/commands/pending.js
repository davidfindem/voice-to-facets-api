// ChatGPT Agentic Memory - Pending Commands Endpoint
// Retrieves pending shortlist commands from ChatGPT memory

export default async function handler(req, res) {
    // CORS headers for Chrome extension access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed. Use GET to retrieve pending commands.',
            allowedMethods: ['GET']
        });
    }

    const requestId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    console.log(`[${requestId}] ⚡ ChatGPT Memory - Pending commands requested`);

    try {
        // Query ChatGPT memory for pending commands
        const memoryData = await queryPendingCommandsFromChatGPT(requestId);
        
        console.log(`[${requestId}] 📥 Retrieved ${memoryData.commands?.length || 0} pending commands from ChatGPT memory`);
        
        return res.status(200).json({
            success: true,
            commands: memoryData.commands || [],
            count: memoryData.commands?.length || 0,
            memoryStatus: memoryData.status,
            chatGPTSummary: memoryData.summary,
            requestId: requestId,
            timestamp: timestamp
        });
        
    } catch (error) {
        console.error(`[${requestId}] ❌ Pending commands error:`, error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error retrieving pending commands',
            message: error.message,
            requestId: requestId,
            timestamp: timestamp
        });
    }
}

// Query ChatGPT memory for pending commands
async function queryPendingCommandsFromChatGPT(requestId) {
    if (!process.env.OPENAI_API_KEY) {
        console.log(`[${requestId}] ⚠️ No OpenAI API key - using fallback`);
        return {
            status: 'fallback',
            summary: 'No ChatGPT memory available',
            commands: []
        };
    }

    try {
        const systemPrompt = `You are an intelligent agentic memory system for a voice-controlled candidate management platform.

Your role:
- REMEMBER candidate data when uploaded
- PROCESS voice commands about candidates
- TRACK pending shortlist actions that need to be executed
- MAINTAIN persistent memory across all API calls

The Chrome extension is asking for pending shortlist commands that need to be executed.

Please provide any pending shortlist actions that haven't been executed yet.

Respond in JSON format:
{
  "commands": [
    {
      "id": "unique_id",
      "type": "shortlist",
      "action": "add" or "remove",
      "candidateName": "Exact candidate name",
      "confidence": 0.0 to 1.0,
      "createdAt": "timestamp",
      "executed": false,
      "source": "voice command that generated this"
    }
  ],
  "summary": "Brief summary of pending commands"
}

Only include commands that haven't been executed yet.`;

        const userMessage = `PENDING COMMANDS QUERY: What shortlist commands are pending execution? The Chrome extension needs to know which candidates to shortlist.`;

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
                max_tokens: 800
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const chatGPTResponse = data.choices[0].message.content;
        
        console.log(`[${requestId}] 🧠 ChatGPT Pending Commands Response: ${chatGPTResponse}`);
        
        // Try to parse JSON response
        let parsedData;
        try {
            parsedData = JSON.parse(chatGPTResponse);
        } catch (parseError) {
            console.log(`[${requestId}] ⚠️ ChatGPT response not JSON, assuming no pending commands`);
            parsedData = {
                commands: [],
                summary: chatGPTResponse
            };
        }
        
        return {
            status: 'retrieved',
            summary: parsedData.summary || 'Pending commands retrieved from ChatGPT memory',
            commands: parsedData.commands || []
        };
        
    } catch (error) {
        console.error(`[${requestId}] ❌ ChatGPT pending commands query error:`, error);
        return {
            status: 'error',
            summary: `Failed to query pending commands: ${error.message}`,
            commands: []
        };
    }
}
