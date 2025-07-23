# 🎤 ElevenLabs Integration Setup

Complete guide to connect ElevenLabs voice commands to your enhanced Vercel API for voice-controlled candidate shortlisting.

---

## 🎯 **What You Need to Configure HEre**

### **ElevenLabs Voice Agent Setup**
Configure ElevenLabs to send voice commands to your API when users speak shortlisting commands.

---

## 🔧 **ElevenLabs Configuration**

### **1. API Endpoint Configuration**
Configure ElevenLabs to send HTTP requests to:
```
https://voice-to-facets-api.vercel.app/api/voice-commands
```

### **2. HTTP Request Setup**
**Method:** `POST`
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "voiceText": "{{VOICE_TEXT}}",
  "source": "ElevenLabs",
  "metadata": {
    "timestamp": "{{TIMESTAMP}}",
    "sessionId": "{{SESSION_ID}}",
    "confidence": "{{CONFIDENCE}}"
  }
}
```

### **3. Voice Agent Prompt**
Configure your ElevenLabs voice agent with this system prompt:

```
You are a voice assistant for candidate shortlisting. Users will speak commands to shortlist candidates.

When users say things like:
- "Shortlist Todd Kurtz"
- "Add Kyle Scharnhorst to the shortlist"
- "I want to shortlist Todd Kurtz and Kyle Scharnhorst"
- "Remove Kenneth Chen from shortlist"

You should acknowledge the command and send the exact voice text to the API for processing.

Current candidates will be provided to you via context updates.

Always be helpful and confirm what shortlisting actions you're processing.
```

---

## 🔄 **Complete Workflow Setup**

### **Step 1: Voice Agent Receives Context**
When Chrome extension uploads candidates, your API can update ElevenLabs context:

```javascript
// Your API will send candidate names to ElevenLabs
// (This requires ElevenLabs API key in environment variables)
const candidateNames = "Todd Kurtz, Kyle Scharnhorst, Kenneth Chen, Scott Goldwater, ...";
```

### **Step 2: User Speaks to ElevenLabs**
User says: *"Shortlist Todd Kurtz and Kyle Scharnhorst"*

### **Step 3: ElevenLabs Sends to Your API**
ElevenLabs sends HTTP POST to your API:
```json
{
  "voiceText": "Shortlist Todd Kurtz and Kyle Scharnhorst",
  "source": "ElevenLabs"
}
```

### **Step 4: Your API Processes with OpenAI**
Your API uses OpenAI to interpret the command:
```json
{
  "interpretation": "User wants to shortlist Todd Kurtz and Kyle Scharnhorst",
  "actions": [
    {"type": "shortlist", "action": "add", "candidateName": "Todd Kurtz"},
    {"type": "shortlist", "action": "add", "candidateName": "Kyle Scharnhorst"}
  ]
}
```

### **Step 5: Chrome Extension Executes**
Chrome extension polls your API, gets the commands, and automatically clicks the shortlist buttons.

---

## 🎤 **ElevenLabs Agent Configuration Examples**

### **Basic Voice Commands**
Train your ElevenLabs agent to recognize these patterns:

```
"Shortlist [candidate name]"
"Add [candidate name] to shortlist"
"I want to shortlist [candidate name]"
"Remove [candidate name] from shortlist"
"Shortlist [name1] and [name2]"
"Add [name1], [name2], and [name3] to the shortlist"
```

### **Response Templates**
Configure ElevenLabs to respond with:

```
"I'm shortlisting [candidate name] for you now."
"Adding [candidate name] to your shortlist."
"Processing shortlist request for [candidate names]."
"I've sent the shortlist command to your system."
```

---

## 🔑 **Environment Variables**

### **Required for OpenAI Processing**
```bash
OPENAI_API_KEY=sk-your_openai_api_key_here
```

### **Optional for ElevenLabs Context Updates**
```bash
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

---

## 🧪 **Testing ElevenLabs Integration**

### **Test 1: Manual API Call**
Test your API directly:
```bash
curl -X POST https://voice-to-facets-api.vercel.app/api/voice-commands \
  -H "Content-Type: application/json" \
  -d '{
    "voiceText": "Shortlist Todd Kurtz",
    "source": "ElevenLabs"
  }'
```

### **Test 2: With Candidates Uploaded**
1. Use Chrome extension to upload candidates
2. Send voice command via API
3. Check that OpenAI processes it correctly
4. Verify Chrome extension receives the commands

### **Test 3: End-to-End Voice Test**
1. Upload candidates via Chrome extension
2. Speak to ElevenLabs: "Shortlist Todd Kurtz"
3. Watch Chrome extension automatically click the shortlist button
4. Monitor the dashboard for real-time workflow

---

## 📊 **Monitoring Voice Commands**

### **Dashboard Monitoring**
Visit `https://rjtlurwc.manus.space` to see:
- **Voice commands** received from ElevenLabs
- **OpenAI interpretations** of the commands
- **Generated actions** for Chrome extension
- **Execution status** of shortlist button clicking

### **API Logs**
Check Vercel function logs to see:
- Voice commands received from ElevenLabs
- OpenAI processing results
- Command generation and execution
- Any errors or issues

---

## 🔧 **Troubleshooting**

### **ElevenLabs Not Sending Commands**
- Check HTTP endpoint configuration
- Verify request format matches expected JSON
- Test with manual curl command first

### **OpenAI Not Processing Commands**
- Verify `OPENAI_API_KEY` environment variable is set
- Check that candidates are uploaded via Chrome extension
- Test with simple voice commands first

### **Chrome Extension Not Receiving Commands**
- Verify extension is polling `/api/candidates/commands/pending`
- Check that commands are being generated by OpenAI
- Test manual shortlisting in extension first

---

## 🎯 **Expected Voice Commands**

### **Shortlisting Commands**
```
✅ "Shortlist Todd Kurtz"
✅ "Add Kyle Scharnhorst to the shortlist"
✅ "I want to shortlist Todd Kurtz and Kyle Scharnhorst"
✅ "Shortlist the first three candidates"
✅ "Add Kenneth Chen, Scott Goldwater, and Prashuk Ajmera"
```

### **Removal Commands** (Future Enhancement)
```
🔄 "Remove Todd Kurtz from shortlist"
🔄 "Unshortlist Kyle Scharnhorst"
🔄 "Take Kenneth Chen off the shortlist"
```

---

## 🚀 **Ready for Voice Control!**

Once configured, your complete voice-controlled workflow will be:

1. **👥 Chrome extension** detects candidates → uploads to your API
2. **🎤 User speaks** to ElevenLabs → "Shortlist Todd Kurtz"
3. **📡 ElevenLabs sends** voice text → your Vercel API
4. **🧠 OpenAI processes** voice → generates shortlist commands
5. **⚡ Chrome extension** polls API → gets commands → clicks buttons
6. **📊 Dashboard shows** complete workflow in real-time

**Hands-free candidate shortlisting with voice commands!** 🎯✨

