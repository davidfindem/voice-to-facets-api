// Enhanced Voice-to-Facets API with Candidate Management
// Fixed CORS headers for Chrome extension integration

// Global data storage (in production, use a database)
let globalData = {
    candidates: [],
    voiceCommands: [],
    pendingCommands: [],
    executionHistory: [],
    lastUpdated: null
};

export default async function handler(req, res) {
    // CORS headers - MUST be first to allow Chrome extension access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    console.log(`[${requestId}] 🎯 Enhanced Voice-to-Facets API - ${req.method} ${req.url}`);

    try {
        // Route different endpoints
        if (req.method === 'POST' && req.url.includes('/candidates/upload')) {
            return await handleCandidateUpload(req, res, requestId);
        }
        
        if (req.method === 'POST' && req.url.includes('/candidates/voice/process')) {
            return await handleVoiceCommand(req, res, requestId);
        }
        
        if (req.method === 'GET' && req.url.includes('/candidates/list')) {
            return await handleCandidateList(req, res, requestId);
        }
        
        if (req.method === 'GET' && req.url.includes('/candidates/commands/pending')) {
            return await handlePendingCommands(req, res, requestId);
        }
        
        if (req.method === 'POST' && req.url.includes('/candidates/commands/report')) {
            return await handleCommandReport(req, res, requestId);
        }
        
        if (req.method === 'GET' && req.url.includes('/candidates/dashboard')) {
            return await handleDashboard(req, res, requestId);
        }
        
        // Default health check for candidates API
        return res.status(200).json({
            status: 'Enhanced Voice-to-Facets API with Candidate Management',
            timestamp: timestamp,
            requestId: requestId,
            endpoints: [
                'POST /api/candidates/upload - Upload candidate data from Chrome extension',
                'POST /api/candidates/voice/process - Process voice commands from ElevenLabs',
                'GET /api/candidates/list - Get current candidate list',
                'GET /api/candidates/commands/pending - Get pending shortlist commands',
                'POST /api/candidates/commands/report - Report command execution status',
                'GET /api/candidates/dashboard - Get dashboard monitoring data'
            ],
            integration: {
                chromeExtension: 'Ready for candidate data upload',
                elevenLabs: 'Ready for voice command processing',
                openAI: process.env.OPENAI_API_KEY ? 'Ready for command interpretation' : 'Ready with fallback keyword matching'
            },
            cors: 'Enabled for Chrome extension access'
        });
        
    } catch (error) {
        console.error(`[${requestId}] ❌ API Error:`, error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            requestId: requestId,
            timestamp: timestamp
        });
    }
}

// Handle candidate data upload from Chrome extension
async function handleCandidateUpload(req, res, requestId) {
    console.log(`[${requestId}] 📤 Candidate upload received`);
    
    const { candidates, source, pageUrl, timestamp } = req.body;
    
    if (!candidates || !Array.isArray(candidates)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid candidates data - expected array of candidates',
            requestId: requestId,
            received: typeof candidates
        });
    }
    
    // Store candidates in global data
    globalData.candidates = candidates;
    globalData.lastUpdated = timestamp || new Date().toISOString();
    
    console.log(`[${requestId}] ✅ Stored ${candidates.length} candidates from ${source}`);
    console.log(`[${requestId}] 📊 Candidate names: ${candidates.map(c => c.name).join(', ')}`);
    
    return res.status(200).json({
        success: true,
        message: `Successfully received ${candidates.length} candidates`,
        candidates: candidates.map(c => c.name),
        source: source,
        pageUrl: pageUrl,
        timestamp: globalData.lastUpdated,
        requestId: requestId
    });
}

// Handle voice commands from ElevenLabs
async function handleVoiceCommand(req, res, requestId) {
    console.log(`[${requestId}] 🎤 Voice command received`);
    
    const { voiceText, metadata } = req.body;
    
    if (!voiceText) {
        return res.status(400).json({
            success: false,
            error: 'Missing voice text',
            requestId: requestId
        });
    }
    
    console.log(`[${requestId}] 🎤 Voice text: "${voiceText}"`);
    
    // Process voice command with OpenAI (if available) or fallback
    const aiResponse = await processVoiceWithAI(voiceText, globalData.candidates, requestId);
    
    // Store voice command
    const voiceCommand = {
        id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: voiceText,
        timestamp: new Date().toISOString(),
        source: metadata?.source || 'ElevenLabs',
        aiResponse: aiResponse,
        processed: true
    };
    
    globalData.voiceCommands.push(voiceCommand);
    
    // Keep only last 50 voice commands
    if (globalData.voiceCommands.length > 50) {
        globalData.voiceCommands = globalData.voiceCommands.slice(-50);
    }
    
    // Generate shortlist commands from AI response
    let commandsGenerated = 0;
    if (aiResponse.actions && aiResponse.actions.length > 0) {
        for (const action of aiResponse.actions) {
            const command = {
                id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: action.type,
                action: action.action,
                candidateName: action.candidateName,
                confidence: action.confidence,
                voiceCommandId: voiceCommand.id,
                timestamp: new Date().toISOString(),
                executed: false
            };
            
            globalData.pendingCommands.push(command);
            commandsGenerated++;
        }
    }
    
    console.log(`[${requestId}] ✅ Generated ${commandsGenerated} shortlist commands`);
    
    return res.status(200).json({
        success: true,
        voiceCommandId: voiceCommand.id,
        interpretation: aiResponse.interpretation,
        actions: aiResponse.actions,
        commandsGenerated: commandsGenerated,
        timestamp: voiceCommand.timestamp,
        requestId: requestId
    });
}

// Get current candidate list
async function handleCandidateList(req, res, requestId) {
    console.log(`[${requestId}] 📋 Candidate list requested`);
    
    return res.status(200).json({
        success: true,
        candidates: globalData.candidates,
        count: globalData.candidates.length,
        lastUpdated: globalData.lastUpdated,
        requestId: requestId
    });
}

// Get pending shortlist commands for Chrome extension
async function handlePendingCommands(req, res, requestId) {
    console.log(`[${requestId}] ⚡ Pending commands requested`);
    
    // Get unexecuted commands
    const pendingCommands = globalData.pendingCommands.filter(cmd => !cmd.executed);
    
    console.log(`[${requestId}] 📥 Returning ${pendingCommands.length} pending commands`);
    
    return res.status(200).json({
        success: true,
        commands: pendingCommands,
        count: pendingCommands.length,
        timestamp: new Date().toISOString(),
        requestId: requestId
    });
}

// Handle command execution reports from Chrome extension
async function handleCommandReport(req, res, requestId) {
    console.log(`[${requestId}] 📤 Command execution report received`);
    
    const { commandId, success, message, timestamp, source } = req.body;
    
    if (!commandId) {
        return res.status(400).json({
            success: false,
            error: 'Missing commandId',
            requestId: requestId
        });
    }
    
    // Update command status
    const commandIndex = globalData.pendingCommands.findIndex(cmd => cmd.id === commandId);
    if (commandIndex !== -1) {
        globalData.pendingCommands[commandIndex].executed = success;
        globalData.pendingCommands[commandIndex].executedAt = timestamp;
        globalData.pendingCommands[commandIndex].executionMessage = message;
        
        console.log(`[${requestId}] ✅ Updated command ${commandId} status: ${success ? 'SUCCESS' : 'FAILED'}`);
    }
    
    // Store in execution history
    if (!globalData.executionHistory) {
        globalData.executionHistory = [];
    }
    
    globalData.executionHistory.push({
        commandId: commandId,
        success: success,
        message: message,
        timestamp: timestamp,
        source: source,
        reportedAt: new Date().toISOString()
    });
    
    // Keep only last 50 execution reports
    if (globalData.executionHistory.length > 50) {
        globalData.executionHistory = globalData.executionHistory.slice(-50);
    }
    
    return res.status(200).json({
        success: true,
        message: 'Command execution report received',
        commandId: commandId,
        requestId: requestId,
        timestamp: new Date().toISOString()
    });
}

// Get dashboard monitoring data
async function handleDashboard(req, res, requestId) {
    console.log(`[${requestId}] 📊 Dashboard data requested`);
    
    const pendingCount = globalData.pendingCommands.filter(cmd => !cmd.executed).length;
    const recentVoiceCommands = globalData.voiceCommands.slice(-10);
    const recentPendingCommands = globalData.pendingCommands.slice(-10);
    
    const dashboardData = {
        candidates: {
            count: globalData.candidates.length,
            names: globalData.candidates.map(c => c.name),
            lastUpdated: globalData.lastUpdated
        },
        voiceCommands: {
            total: globalData.voiceCommands.length,
            recent: recentVoiceCommands
        },
        pendingCommands: {
            unExecuted: pendingCount,
            recent: recentPendingCommands
        },
        systemStatus: {
            apiHealth: 'online',
            lastActivity: new Date().toISOString(),
            corsEnabled: true,
            openAIAvailable: !!process.env.OPENAI_API_KEY
        }
    };
    
    return res.status(200).json({
        success: true,
        dashboard: dashboardData,
        requestId: requestId,
        timestamp: new Date().toISOString()
    });
}

// Process voice commands with OpenAI (if available) or fallback keyword matching
async function processVoiceWithAI(voiceText, candidates, requestId) {
    const candidateNames = candidates.map(c => c.name);
    
    // Try OpenAI first if API key is available
    if (process.env.OPENAI_API_KEY) {
        try {
            const systemPrompt = `You are a voice command interpreter for a candidate shortlisting system.

Current candidates available: ${candidateNames.join(', ')}

Your job is to interpret voice commands and generate shortlist actions. 

Voice commands might be like:
- "Shortlist Todd Kurtz and Kyle Scharnhorst"
- "Add Kenneth Chen to the shortlist"
- "I want to shortlist the first three candidates"
- "Remove Scott Goldwater from shortlist"

Respond with JSON in this format:
{
  "interpretation": "Brief explanation of what the user wants",
  "actions": [
    {
      "type": "shortlist",
      "action": "add" or "remove",
      "candidateName": "Exact candidate name",
      "confidence": 0.0 to 1.0
    }
  ]
}

If no clear shortlist action is requested, return empty actions array.
Only use exact candidate names from the provided list.`;

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
                        { role: 'user', content: voiceText }
                    ],
                    temperature: 0.1,
                    max_tokens: 500
                })
            });

            if (response.ok) {
                const data = await response.json();
                const aiResponse = data.choices[0].message.content;
                
                console.log(`[${requestId}] 🧠 OpenAI response: ${aiResponse}`);
                
                const parsedResponse = JSON.parse(aiResponse);
                console.log(`[${requestId}] ✅ OpenAI parsed ${parsedResponse.actions?.length || 0} actions`);
                
                return parsedResponse;
            }
        } catch (error) {
            console.error(`[${requestId}] ❌ OpenAI error:`, error);
        }
    }
    
    // Fallback: simple keyword matching
    console.log(`[${requestId}] 🔄 Using fallback keyword matching`);
    
    const fallbackResponse = {
        interpretation: `Fallback keyword processing: "${voiceText}"`,
        actions: []
    };
    
    // Simple keyword matching for shortlisting
    const lowerVoiceText = voiceText.toLowerCase();
    
    if (lowerVoiceText.includes('shortlist') || lowerVoiceText.includes('add')) {
        candidateNames.forEach(name => {
            if (lowerVoiceText.includes(name.toLowerCase())) {
                fallbackResponse.actions.push({
                    type: 'shortlist',
                    action: 'add',
                    candidateName: name,
                    confidence: 0.7
                });
            }
        });
    }
    
    console.log(`[${requestId}] 🔄 Fallback generated ${fallbackResponse.actions.length} actions`);
    
    return fallbackResponse;
}

