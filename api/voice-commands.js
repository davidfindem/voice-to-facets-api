// ChatGPT Agentic Memory - Voice Commands Endpoint
// Processes voice commands using ChatGPT's memory of candidates

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const requestId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    console.log(`[${requestId}] 🎤 ChatGPT Memory - Voice command: ${req.method} ${req.url}`);

    try {
        if (req.method === 'GET') {
            // Return current voice commands from ChatGPT memory
            const memoryData = await queryVoiceCommandsFromChatGPT(requestId);
            
            return res.status(200).json({
                commands: memoryData.commands || [],
                timestamp: timestamp,
                memoryStatus: memoryData.status,
                chatGPTSummary: memoryData.summary,
                requestId: requestId
            });
        }
        
        if (req.method === 'POST') {
            // Process new voice command with ChatGPT
            const { voiceText, metadata } = req.body;
            
            if (!voiceText) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing voice text',
                    requestId: requestId
                });
            }
            
            console.log(`[${requestId}] 🎤 Processing voice: "${voiceText}"`);
            
            const voiceResponse = await processVoiceWithChatGPTMemory(voiceText, metadata, requestId);
            
            return res.status(200).json({
                success: true,
                voiceText: voiceText,
                interpretation: voiceResponse.interpretation,
                actions: voiceResponse.actions,
                commandsGenerated: voiceResponse.actions?.length || 0,
                memoryStatus: voiceResponse.status,
                chatGPTResponse: voiceResponse.summary,
                timestamp: timestamp,
                requestId: requestId
            });
        }
        
        // Default response for other methods
        return res.status(200).json({
            status: 'ChatGPT Agentic Memory - Voice Commands API',
            timestamp: timestamp,
            requestId: requestId,
            memorySystem: 'ChatGPT Active',
            endpoints: [
                'GET /api/voice-commands - Get current voice commands from memory',
                'POST /api/voice-commands - Process new voice command with ChatGPT'
            ]
        });
        
    } catch (error) {
        console.error(`[${requestId}] ❌ Voice command error:`, error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error processing voice command',
            message: error.message,
            requestId: requestId,
            timestamp: timestamp
        });
    }
}

// Query ChatGPT memory for voice commands
async function queryVoiceCommandsFromChatGPT(requestId) {
    if (!process.env.OPENAI_API_KEY) {
        return {
            status: 'fallback',
            summary: 'No ChatGPT memory available',
            commands: []
        };
    }

    try {
        const systemPrompt = `You are an intelligent agentic memory system for a voice-controlled candidate management platform.

Please provide a list of recent voice commands you've processed, if any.

Respond in JSON format:
{
  "commands": [
    {"text": "voice command", "timestamp": "time", "processed": true}
  ],
  "summary": "Brief summary of voice command history"
}`;

        const userMessage = `VOICE COMMANDS QUERY: What voice commands have you processed recently? Please list them.`;

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
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const chatGPTResponse = data.choices[0].message.content;
        
        let parsedData;
        try {
            parsedData = JSON.parse(chatGPTResponse);
        } catch (parseError) {
            parsedData = {
                commands: [],
                summary: chatGPTResponse
            };
        }
        
        return {
            status: 'retrieved',
            summary: parsedData.summary,
            commands: parsedData.commands || []
        };
        
    } catch (error) {
        console.error(`[${requestId}] ❌ ChatGPT voice query error:`, error);
        return {
            status: 'error',
            summary: `Failed to query voice commands: ${error.message}`,
            commands: []
        };
    }
}

// Process voice command with ChatGPT memory
async function processVoiceWithChatGPTMemory(voiceText, metadata, requestId) {
    if (!process.env.OPENAI_API_KEY) {
        console.log(`[${requestId}] ⚠️ No OpenAI API key - using fallback processing`);
        return {
            status: 'fallback',
            interpretation: `Fallback processing: "${voiceText}"`,
            actions: [],
            summary: 'Processed without ChatGPT memory'
        };
    }

    try {
        const systemPrompt = `You are an intelligent agentic memory system for a voice-controlled candidate management platform.

Your role:
- REMEMBER candidate data when uploaded
- PROCESS voice commands about candidates using your memory
- GENERATE specific shortlist actions based on voice commands
- MAINTAIN context of all previous interactions

When processing voice commands:
1. Use your memory of stored candidates
2. Interpret the voice command intent
3. Generate specific actions for the Chrome extension to execute

Voice commands might be like:
- "Shortlist Todd Kurtz and Kyle Scharnhorst"
- "Add Kenneth Chen to the shortlist"
- "Remove Scott Goldwater from shortlist"

Respond in JSON format:
{
  "interpretation": "What the user wants to do",
  "actions": [
    {
      "type": "shortlist",
      "action": "add" or "remove", 
      "candidateName": "Exact candidate name from memory",
      "confidence": 0.0 to 1.0
    }
  ],
  "summary": "Brief summary of what you processed"
}

Only generate actions for candidates you actually remember from previous uploads.`;

        const userMessage = `VOICE COMMAND: "${voiceText}"

Please process this voice command using your memory of stored candidates. Generate appropriate shortlist actions if the command is about shortlisting candidates.

Source: ${metadata?.source || 'Unknown'}
Timestamp: ${new Date().toISOString()}`;

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
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const chatGPTResponse = data.choices[0].message.content;
        
        console.log(`[${requestId}] 🧠 ChatGPT Voice Processing: ${chatGPTResponse}`);
        
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(chatGPTResponse);
        } catch (parseError) {
            console.log(`[${requestId}] ⚠️ ChatGPT response not JSON, using text interpretation`);
            parsedResponse = {
                interpretation: chatGPTResponse,
                actions: [],
                summary: 'Response was not in JSON format'
            };
        }
        
        return {
            status: 'processed',
            interpretation: parsedResponse.interpretation,
            actions: parsedResponse.actions || [],
            summary: parsedResponse.summary || 'Voice command processed with ChatGPT memory'
        };
        
    } catch (error) {
        console.error(`[${requestId}] ❌ ChatGPT voice processing error:`, error);
        return {
            status: 'error',
            interpretation: `Error processing: "${voiceText}"`,
            actions: [],
            summary: `Failed to process with ChatGPT: ${error.message}`
        };
    }
}

