// Dashboard endpoint for monitoring data
// This file handles: GET /api/candidates/dashboard

// Global data storage (in production, use a database)
let globalData = {
    candidates: [],
    voiceCommands: [],
    pendingCommands: [],
    executionHistory: [],
    lastUpdated: null
};

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
    
    console.log(`[${requestId}] 📊 Dashboard data requested`);

    try {
        const pendingCount = globalData.pendingCommands.filter(cmd => !cmd.executed).length;
        const recentVoiceCommands = globalData.voiceCommands.slice(-10);
        const recentPendingCommands = globalData.pendingCommands.slice(-10);
        
        const dashboardData = {
            candidates: {
                count: globalData.candidates.length,
                names: globalData.candidates.map(c => c.name),
                lastUpdated: globalData.lastUpdated,
                details: globalData.candidates
            },
            voiceCommands: {
                total: globalData.voiceCommands.length,
                recent: recentVoiceCommands
            },
            pendingCommands: {
                unExecuted: pendingCount,
                total: globalData.pendingCommands.length,
                recent: recentPendingCommands
            },
            executionHistory: {
                total: globalData.executionHistory?.length || 0,
                recent: globalData.executionHistory?.slice(-5) || []
            },
            systemStatus: {
                apiHealth: 'online',
                lastActivity: timestamp,
                corsEnabled: true,
                openAIAvailable: !!process.env.OPENAI_API_KEY,
                dataLastUpdated: globalData.lastUpdated
            }
        };
        
        console.log(`[${requestId}] ✅ Dashboard data compiled: ${globalData.candidates.length} candidates, ${globalData.voiceCommands.length} voice commands`);
        
        return res.status(200).json({
            success: true,
            dashboard: dashboardData,
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

