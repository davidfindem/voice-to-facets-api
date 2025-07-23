# 🎯 Enhanced Voice-to-Facets API 1117AM

Complete voice-controlled candidate management system with Chrome extension integration, OpenAI processing, and ElevenLabs voice commands.

## 🚀 **What This Adds to Your Existing API**

### **✅ Keeps Your Existing Functionality**
- **`/api/voice-commands`** - Your original endpoint still works exactly the same
- **Backward compatibility** - All existing integrations continue to work
- **Enhanced with AI** - Now processes voice commands with OpenAI when candidates are available

### **✅ Adds New Candidate Management**
- **`/api/candidates/*`** - Complete Chrome extension integration
- **OpenAI processing** - Interprets voice commands for candidate shortlisting
- **Real-time workflow** - Voice → AI → Chrome extension → automatic button clicking

---

## 📋 **API Endpoints**

### **🎤 Enhanced Voice Commands (Your Existing Endpoint)**
```
GET  /api/voice-commands     - Get current voice commands
POST /api/voice-commands     - Process voice from ElevenLabs (now with AI!)
```

### **👥 New Candidate Management**
```
POST /api/candidates/upload           - Upload candidate data from Chrome extension
POST /api/candidates/voice/process    - Process voice commands (alternative to voice-commands)
GET  /api/candidates/list             - Get current candidate list
GET  /api/candidates/commands/pending - Get pending shortlist commands for extension
POST /api/candidates/commands/report  - Report command execution status from extension
GET  /api/candidates/dashboard        - Get dashboard monitoring data
```

---

## 🔧 **Setup Instructions**

### **1. Upload Files to Your Vercel Repo**
Upload these files to your existing `voice-to-facets-api.vercel.app` repository:

```
your-repo/
├── api/
│   ├── voice-commands.js    (replace your existing file)
│   └── candidates.js        (new file)
├── package.json             (update your existing file)
├── vercel.json              (update your existing file)
└── README.md                (this file)
```

### **2. Set Environment Variables in Vercel**
In your Vercel dashboard, add these environment variables:

```bash
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here  # (optional for now)
```

### **3. Deploy to Vercel**
```bash
git add .
git commit -m "Enhanced API with candidate management and OpenAI integration"
git push origin main
```

Vercel will automatically deploy your enhanced API.

---

## 🔄 **Complete Workflow**

### **Step 1: Chrome Extension Uploads Candidates**
```javascript
// Chrome extension sends candidate data
POST /api/candidates/upload
{
  "candidates": [
    {"name": "Todd Kurtz", "jobTitle": "Software Engineer", ...},
    {"name": "Kyle Scharnhorst", "jobTitle": "Product Manager", ...}
  ],
  "source": "Chrome Extension v7.2",
  "pageUrl": "https://app-next.findem.ai/...",
  "timestamp": "2025-07-23T16:45:00.000Z"
}
```

### **Step 2: ElevenLabs Sends Voice Command**
```javascript
// ElevenLabs sends voice text to your API
POST /api/voice-commands
{
  "voiceText": "Shortlist Todd Kurtz and Kyle Scharnhorst",
  "source": "ElevenLabs"
}
```

### **Step 3: OpenAI Processes Voice Command**
```javascript
// Your API uses OpenAI to interpret the voice command
// Returns structured actions:
{
  "interpretation": "User wants to shortlist Todd Kurtz and Kyle Scharnhorst",
  "actions": [
    {"type": "shortlist", "action": "add", "candidateName": "Todd Kurtz", "confidence": 0.95},
    {"type": "shortlist", "action": "add", "candidateName": "Kyle Scharnhorst", "confidence": 0.95}
  ]
}
```

### **Step 4: Chrome Extension Gets Commands**
```javascript
// Chrome extension polls for pending commands
GET /api/candidates/commands/pending
// Returns:
{
  "commands": [
    {"id": "cmd_123", "candidateName": "Todd Kurtz", "action": "add", ...},
    {"id": "cmd_124", "candidateName": "Kyle Scharnhorst", "action": "add", ...}
  ]
}
```

### **Step 5: Chrome Extension Executes Commands**
```javascript
// Extension clicks shortlist buttons and reports back
POST /api/candidates/commands/report
{
  "commandId": "cmd_123",
  "success": true,
  "message": "Todd Kurtz shortlisted successfully",
  "timestamp": "2025-07-23T16:45:30.000Z"
}
```

---

## 🎯 **Testing Your Enhanced API**

### **Test 1: Check Your Original Endpoint Still Works**
```bash
curl https://voice-to-facets-api.vercel.app/api/voice-commands
# Should return: {"commands":[],"timestamp":"..."}
```

### **Test 2: Check New Candidate Endpoints**
```bash
curl https://voice-to-facets-api.vercel.app/api/candidates
# Should return API info with all endpoints listed
```

### **Test 3: Test Voice Processing with OpenAI**
```bash
curl -X POST https://voice-to-facets-api.vercel.app/api/voice-commands \
  -H "Content-Type: application/json" \
  -d '{"voiceText": "Hello test"}'
# Should process with OpenAI (if candidates are uploaded)
```

---

## 🔗 **ElevenLabs Integration**

### **Configure ElevenLabs to Send Voice Commands**
Set up ElevenLabs to send HTTP POST requests to:
```
https://voice-to-facets-api.vercel.app/api/voice-commands
```

With payload:
```json
{
  "voiceText": "{{VOICE_TEXT}}",
  "source": "ElevenLabs",
  "metadata": {
    "timestamp": "{{TIMESTAMP}}",
    "confidence": "{{CONFIDENCE}}"
  }
}
```

---

## 📊 **Monitoring Dashboard**

The dashboard at `https://rjtlurwc.manus.space` will show:
- **Candidates uploaded** from Chrome extension
- **Voice commands processed** from ElevenLabs
- **AI interpretations** from OpenAI
- **Pending actions** for Chrome extension
- **Execution results** from shortlist button clicking

---

## 🔧 **Environment Variables Required**

```bash
# Required for OpenAI voice processing
OPENAI_API_KEY=sk-...

# Optional for ElevenLabs context updates
ELEVENLABS_API_KEY=...
```

---

## ✅ **What This Gives You**

### **🎤 Voice-Controlled Shortlisting**
- Speak to ElevenLabs: *"Shortlist Todd Kurtz and Kyle Scharnhorst"*
- OpenAI interprets the command
- Chrome extension automatically clicks the shortlist buttons
- Complete hands-free candidate management

### **📊 Real-time Monitoring**
- See voice commands as they come in
- Watch AI interpretations in real-time
- Monitor shortlist button clicking success/failure
- Complete workflow visibility

### **🔄 Seamless Integration**
- Your existing `/api/voice-commands` endpoint enhanced with AI
- New `/api/candidates/*` endpoints for Chrome extension
- Backward compatible with existing integrations
- Professional monitoring dashboard

---

## 🚀 **Ready to Deploy!**

1. **Upload these files** to your Vercel repo
2. **Set environment variables** (OPENAI_API_KEY)
3. **Deploy** (automatic with git push)
4. **Install Chrome extension v7.2** 
5. **Configure ElevenLabs** to send voice to your API
6. **Start voice-controlled candidate shortlisting!**

**Your enhanced API will be live at `voice-to-facets-api.vercel.app` with all the new functionality!** 🎯✨

