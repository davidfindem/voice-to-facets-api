// Enhanced voice-commands.js - Your existing endpoint with candidate integration
// This maintains backward compatibility while adding new functionality

// Import the candidate processing function
import { processVoiceWithOpenAI } from './candidates.js';

// Global data storage (shared with candidates.js)
let globalData = {
    commands: [],
    timestamp: null,
    candidates: [],
    voiceCommands: [],
    pendingCommands: []
};

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const requestId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${requestId}] 🎤 Voice Commands API - ${req.method} ${req.url}`);

    try {
        if (req.method === 'GET') {
            // Your existing GET endpoint - return current commands
            return res.status(200).json({
                commands: globalData.commands,
                timestamp: new Date().toISOString(),
                candidatesAvailable: globalData.candidates.length,
                pendingActions: globalData.pendingCommands.filter(cmd => !cmd.executed).length
            });
        }
        
        if (req.method === 'POST') {
            // Enhanced POST endpoint - process voice commands from ElevenLabs
            const { voiceText, metadata, source } = req.body;
            
            if (!voiceText) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing voice text',
                    requestId: requestId
                });
            }
            
            console.log(`[${requestId}] 🎤 Processing voice: "${voiceText}"`);
            
            // If we have candidates, process with AI for shortlisting
            if (globalData.candidates.length > 0) {
                console.log(`[${requestId}] 🧠 Processing with OpenAI (${globalData.candidates.length} candidates available)`);
                
                // Process with OpenAI for candidate shortlisting
                const aiResponse = await processVoiceWithOpenAI(voiceText, globalData.candidates, requestId);
                
                // Store the voice command
                const voiceCommand = {
                    id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    text: voiceText,
                    timestamp: new Date().toISOString(),
                    source: source || 'ElevenLabs',
                    aiResponse: aiResponse,
                    processed: true
                };
                
                globalData.voiceCommands.push(voiceCommand);
                
                // Generate shortlist commands
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
                        globalData.commands.push(command); // For backward compatibility
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
                    commands: globalData.commands, // For backward compatibility
                    timestamp: new Date().toISOString(),
                    requestId: requestId
                });
                
            } else {
                // No candidates available - store as basic voice command
                console.log(`[${requestId}] ⚠️ No candidates available for shortlisting`);
                
                const basicCommand = {
                    id: `basic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    text: voiceText,
                    timestamp: new Date().toISOString(),
                    source: source || 'ElevenLabs',
                    processed: false,
                    note: 'No candidates available for processing'
                };
                
                globalData.commands.push(basicCommand);
                
                return res.status(200).json({
                    success: true,
                    message: 'Voice command received but no candidates available for shortlisting',
                    command: basicCommand,
                    commands: globalData.commands,
                    timestamp: new Date().toISOString(),
                    requestId: requestId,
                    note: 'Upload candidates via Chrome extension first'
                });
            }
        }
        
        // Method not allowed
        return res.status(405).json({
            error: 'Method not allowed',
            allowedMethods: ['GET', 'POST'],
            requestId: requestId
        });
        
    } catch (error) {
        console.error(`[${requestId}] ❌ Voice Commands Error:`, error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            requestId: requestId,
            timestamp: new Date().toISOString()
        });
    }
}

// Helper function to process voice with OpenAI (shared with candidates.js)
async function processVoiceWithOpenAI(voiceText, candidates, requestId) {
    const candidateNames = candidates.map(c => c.name);
    
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

    try {
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

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        console.log(`[${requestId}] 🧠 OpenAI response: ${aiResponse}`);
        
        const parsedResponse = JSON.parse(aiResponse);
        console.log(`[${requestId}] ✅ Parsed ${parsedResponse.actions?.length || 0} actions`);
        
        return parsedResponse;
        
    } catch (error) {
        console.error(`[${requestId}] ❌ OpenAI error:`, error);
        
        // Fallback: simple keyword matching
        const fallbackResponse = {
            interpretation: `Fallback processing: "${voiceText}"`,
            actions: []
        };
        
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
}

