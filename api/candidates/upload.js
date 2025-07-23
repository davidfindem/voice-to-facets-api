// Upload endpoint for candidate data from Chrome extension
// This file handles: POST /api/candidates/upload

// Global data storage (in production, use a database)
let globalData = {
    candidates: [],
    voiceCommands: [],
    pendingCommands: [],
    executionHistory: [],
    lastUpdated: null
};

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
    
    console.log(`[${requestId}] 📤 Candidate upload request received`);

    try {
        const { candidates, source, pageUrl, timestamp: clientTimestamp } = req.body;
        
        if (!candidates || !Array.isArray(candidates)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid candidates data - expected array of candidates',
                requestId: requestId,
                received: typeof candidates,
                example: {
                    candidates: [
                        { name: "John Doe", jobTitle: "Software Engineer", location: "San Francisco" }
                    ],
                    source: "Chrome Extension v7.2",
                    pageUrl: "https://app-next.findem.ai/..."
                }
            });
        }
        
        // Store candidates in global data
        globalData.candidates = candidates;
        globalData.lastUpdated = clientTimestamp || timestamp;
        
        console.log(`[${requestId}] ✅ Successfully stored ${candidates.length} candidates`);
        console.log(`[${requestId}] 📊 Candidate names: ${candidates.map(c => c.name).join(', ')}`);
        console.log(`[${requestId}] 🌐 Source: ${source}`);
        console.log(`[${requestId}] 🔗 Page URL: ${pageUrl}`);
        
        return res.status(200).json({
            success: true,
            message: `Successfully uploaded ${candidates.length} candidates`,
            data: {
                candidatesReceived: candidates.length,
                candidateNames: candidates.map(c => c.name),
                source: source,
                pageUrl: pageUrl,
                uploadedAt: globalData.lastUpdated
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

