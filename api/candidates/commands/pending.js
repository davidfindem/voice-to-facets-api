// Pending commands endpoint for Chrome extension
// This file handles: GET /api/candidates/commands/pending

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
    
    console.log(`[${requestId}] ⚡ Pending commands requested`);

    try {
        // Get unexecuted commands
        const pendingCommands = globalData.pendingCommands.filter(cmd => !cmd.executed);
        
        console.log(`[${requestId}] 📥 Found ${pendingCommands.length} pending commands`);
        
        return res.status(200).json({
            success: true,
            commands: pendingCommands,
            count: pendingCommands.length,
            totalCommands: globalData.pendingCommands.length,
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

