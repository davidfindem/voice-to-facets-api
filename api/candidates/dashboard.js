// ChatGPT Agentic Memory - Dashboard Endpoint
// Retrieves data from ChatGPT's intelligent memory

export default async function handler(req, res) {
    // CORS headers for dashboard access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow GET requests for dashboard
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed. Use GET to retrieve dashboard data.',
            allowedMethods: ['GET']
        });
    }

    const requestId = `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    console.log(`[${requestId}] 📊 ChatGPT Memory - Dashboard data requested`);

    try {
        // Query ChatGPT memory for dashboard data
        const memoryData = await queryDashboardFromChatGPT(requestId);
        
        console.log(`[${requestId}] ✅ Retrieved dashboard data from ChatGPT memory`);
        
        return res.status(200).json({
            success: true,
            dashboard: memoryData.dashboard,
            memoryStatus: memoryData.status,
            chatGPTSummary: memoryData.summary,
            requestId: requestId,
            timestamp: timestamp
        });
        
    } catch (error) {
        console.error(`[${requestId}] ❌ Dashboard error:`, error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error retrieving dashboard data',
            message: error.message,
            requestId: requestId,
            timestamp: timestamp
        });
    }
}

// Query ChatGPT memory for dashboard data
async function queryDashboardFromChatGPT(requestId) {
    if (!process.env.OPENAI_API_KEY) {
        console.log(`[${requestId}] ⚠️ No OpenAI API key - using fallback data`);
        return {
            status: 'fallback',
            summary: 'No ChatGPT memory available',
            dashboard: {
                candidates: { count: 0, names: [], lastUpdated: null },
                voiceCommands: { total: 0, recent: [] },
                pendingCommands: { unExecuted: 0, recent: [] },
                systemStatus: { 
                    apiHealth: 'online', 
                    lastActivity: new Date().toISOString(),
                    memorySystem: 'ChatGPT unavailable'
                }
            }
        };
    }

    try {
        const systemPrompt = `You are an intelligent agentic memory system for a voice-controlled candidate management platform.

Your role:
- REMEMBER candidate data when uploaded
- PROVIDE candidate information when requested  
- PROCESS voice commands about candidates
- MAINTAIN persistent memory across all API calls

The dashboard is requesting current system status. Please provide:
1. How many candidates you currently remember
2. List of candidate names you have stored
3. Any recent voice commands you've processed
4. Any pending shortlist actions
5. When you last received data

Respond in JSON format:
{
  "candidates": {
    "count": number,
    "names": ["name1", "name2"],
    "lastUpdated": "timestamp or null"
  },
  "voiceCommands": {
    "total": number,
    "recent": [{"text": "command", "timestamp": "time"}]
  },
  "pendingCommands": {
    "unExecuted": number,
    "recent": [{"candidateName": "name", "action": "add"}]
  },
  "summary": "Brief summary of current memory state"
}`;

        const userMessage = `DASHBOARD QUERY: Please provide current dashboard data from your memory. What candidates do you remember? Any voice commands processed? Any pending actions?`;

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
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const chatGPTResponse = data.choices[0].message.content;
        
        console.log(`[${requestId}] 🧠 ChatGPT Dashboard Response: ${chatGPTResponse}`);
        
        // Try to parse JSON response
        let dashboardData;
        try {
            dashboardData = JSON.parse(chatGPTResponse);
        } catch (parseError) {
            console.log(`[${requestId}] ⚠️ ChatGPT response not JSON, using text summary`);
            dashboardData = {
                candidates: { count: 0, names: [], lastUpdated: null },
                voiceCommands: { total: 0, recent: [] },
                pendingCommands: { unExecuted: 0, recent: [] },
                summary: chatGPTResponse
            };
        }
        
        // Add system status
        dashboardData.systemStatus = {
            apiHealth: 'online',
            lastActivity: new Date().toISOString(),
            memorySystem: 'ChatGPT Active',
            openAIAvailable: true
        };
        
        return {
            status: 'retrieved',
            summary: dashboardData.summary || 'Data retrieved from ChatGPT memory',
            dashboard: dashboardData
        };
        
    } catch (error) {
        console.error(`[${requestId}] ❌ ChatGPT Dashboard query error:`, error);
        return {
            status: 'error',
            summary: `Failed to query ChatGPT memory: ${error.message}`,
            dashboard: {
                candidates: { count: 0, names: [], lastUpdated: null },
                voiceCommands: { total: 0, recent: [] },
                pendingCommands: { unExecuted: 0, recent: [] },
                systemStatus: { 
                    apiHealth: 'online', 
                    lastActivity: new Date().toISOString(),
                    memorySystem: 'ChatGPT Error'
                }
            }
        };
    }
}
