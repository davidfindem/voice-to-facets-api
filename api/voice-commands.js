// Voice-to-Facets API - Translates voice commands to search filter actions

// In-memory storage for pending commands (in production, use Redis or database)
let pendingCommands = [];

export default async function handler(req, res) {
  // Enable CORS for Chrome extension and web interface
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      // Receive voice command and translate to filter actions
      await handleVoiceCommand(req, res);
    } else if (req.method === 'GET') {
      // Chrome extension polls for pending commands
      await handleGetCommands(req, res);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

async function handleVoiceCommand(req, res) {
  const { voiceText, currentFilters } = req.body;

  if (!voiceText) {
    res.status(400).json({ error: 'voiceText is required' });
    return;
  }

  console.log('Received voice command:', voiceText);
  console.log('Current filters:', currentFilters);

  // Translate voice to commands using ChatGPT
  const commands = await translateVoiceToCommands(voiceText, currentFilters);

  if (commands && commands.length > 0) {
    // Add commands to queue for Chrome extension
    pendingCommands.push(...commands);
    console.log('Added commands to queue:', commands);

    res.json({
      success: true,
      commandsAdded: commands.length,
      commands: commands,
      message: `Translated voice command into ${commands.length} filter actions`
    });
  } else {
    res.json({
      success: false,
      message: 'Could not translate voice command to filter actions'
    });
  }
}

async function handleGetCommands(req, res) {
  // Return pending commands and clear the queue
  const commands = [...pendingCommands];
  pendingCommands = []; // Clear queue

  console.log(`Returning ${commands.length} pending commands to Chrome extension`);

  res.json({
    commands: commands,
    timestamp: new Date().toISOString()
  });
}

async function translateVoiceToCommands(voiceText, currentFilters = {}) {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const systemPrompt = `You are a search filter translator for a job search website. Convert natural language voice commands into structured filter actions.

AVAILABLE FACETS:
1. "Years of Experience" - Values like "0-2", "3-5", "6-10", "10+" 
2. "Keywords" - Any job-related keywords or skills
3. "Location" - Cities, states, countries, or "Remote"

ACTIONS:
- "remove" - Remove existing filters
- "add" - Add new filters  
- "clear" - Clear all filters in a facet
- "replace" - Remove existing and add new

CURRENT FILTERS: ${JSON.stringify(currentFilters)}

EXAMPLES:
Voice: "Find people with 5 years experience in San Francisco"
Output: [
  {"action": "add", "facet": "Years of Experience", "value": "3-5"},
  {"action": "add", "facet": "Location", "value": "San Francisco"}
]

Voice: "Remove all locations and add remote workers"
Output: [
  {"action": "clear", "facet": "Location"},
  {"action": "add", "facet": "Location", "value": "Remote"}
]

Voice: "Look for Python developers with 10+ years"
Output: [
  {"action": "add", "facet": "Keywords", "value": "Python"},
  {"action": "add", "facet": "Years of Experience", "value": "10+"}
]

Return ONLY a JSON array of command objects. No explanations.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer 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`,

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
    const commandsText = data.choices[0].message.content.trim();

    console.log('ChatGPT response:', commandsText);

    // Parse JSON response
    const commands = JSON.parse(commandsText);

    // Validate commands structure
    if (!Array.isArray(commands)) {
      throw new Error('ChatGPT response is not an array');
    }

    // Validate each command
    const validCommands = commands.filter(cmd => {
      return cmd.action && cmd.facet && 
             ['remove', 'add', 'clear', 'replace'].includes(cmd.action) &&
             ['Years of Experience', 'Keywords', 'Location'].includes(cmd.facet);
    });

    console.log('Valid commands:', validCommands);
    return validCommands;

  } catch (error) {
    console.error('Error translating voice to commands:', error);
    return [];
  }
}

