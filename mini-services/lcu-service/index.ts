import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import * as fs from 'node:fs/promises'
import { Agent } from 'undici'

const app = new Hono()
const PORT = 3003

// Enable CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}))

interface Lockfile {
  processName: string
  pid: number
  port: number
  password: string
  protocol: string
}

// Possible lockfile paths for different operating systems
const LOCKFILE_PATHS = [
  // Custom User Path
  'D:/Riot Games/League of Legends/League of Legends/lockfile',
  // Windows
  'C:/Riot Games/League of Legends/lockfile',
  // Mac
  '/Applications/League of Legends.app/Contents/LoL/RADS/projects/league_client/releases/0.0.0.1/deploy/lockfile',
  // Alternative Windows paths
  'C:/Program Files/Riot Games/League of Legends/lockfile',
  'C:/Program Files (x86)/Riot Games/League of Legends/lockfile',
]

// Cache for LCU credentials
let lcuCredentials: Lockfile | null = null

// Function to read lockfile
async function readLockfile(): Promise<Lockfile | null> {
  console.log('🔍 Searching for lockfile...')
  try {
    for (const path of LOCKFILE_PATHS) {
      console.log(`Checking path: ${path}`)
      try {
        const content = await fs.readFile(path, 'utf8')
        console.log(`✅ Found lockfile at: ${path}`)
        const [processName, pid, port, password, protocol] = content.split(':')

        return {
          processName,
          pid: parseInt(pid),
          port: parseInt(port),
          password,
          protocol,
        }
      } catch (e) {
        // Try next path
        console.log(`❌ Failed to read ${path}`)
        continue
      }
    }
    console.log('❌ Lockfile not found in any known path')
    return null
  } catch (error) {
    console.error('Error reading lockfile:', error)
    return null
  }
}

// Function to get or initialize LCU credentials
async function getLCUCredentials(): Promise<Lockfile | null> {
  if (lcuCredentials) {
    return lcuCredentials
  }

  lcuCredentials = await readLockfile()
  return lcuCredentials
}

// Function to make request to LCU API
async function lcuRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
  const credentials = await getLCUCredentials()

  if (!credentials) {
    throw new Error('League of Legends client is not running or lockfile not found')
  }

  const url = `${credentials.protocol}://127.0.0.1:${credentials.port}${endpoint}`
  const auth = btoa(`riot:${credentials.password}`)

  const headers: HeadersInit = {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
  }

  const options: RequestInit = {
    method,
    headers,
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, {
      ...options,
      // Disable SSL verification for self-signed certs
      dispatcher: new Agent({
        connect: {
            rejectUnauthorized: false
        }
      })
    })

    if (!response.ok) {
      throw new Error(`LCU API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error: any) {
    // If connection fails, try to re-read lockfile
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      lcuCredentials = null
      throw new Error('Cannot connect to League of Legends client. Is it running?')
    }
    throw error
  }
}

// Get all conversations (chats)
async function getConversations(): Promise<any[]> {
  try {
    const data = await lcuRequest('/lol-chat/v1/conversations')
    console.log(`📦 Fetched ${Array.isArray(data) ? data.length : 0} conversations`)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error getting conversations:', error)
    return []
  }
}

// Find lobby chat conversation ID
async function getLobbyConversationId(): Promise<string | null> {
  try {
    const conversations = await getConversations()
    
    console.log('🔍 Looking for lobby chat...')
    // Look for lobby chat (type: 'championSelect' or 'premade')
    const lobbyChat = conversations.find((conv: any) => {
      console.log(` - Checking conv: ${conv.id} (type: ${conv.type})`)
      // Log full object to debug properties
      console.log(JSON.stringify(conv, null, 2))
      return conv.type === 'championSelect' || conv.type === 'premade' || conv.type === 'party'
    })

    if (lobbyChat) {
      console.log(`✅ Found lobby chat: ${lobbyChat.id} (${lobbyChat.type})`)
    } else {
      console.log('❌ No lobby chat found')
    }

    return lobbyChat?.id || null
  } catch (error) {
    console.error('Error getting lobby conversation ID:', error)
    return null
  }
}

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'LCU API Service', port: PORT })
})

// Check if LoL client is running
app.get('/status', async (c) => {
  const credentials = await getLCUCredentials()
  return c.json({
    connected: !!credentials,
    port: credentials?.port || null,
    protocol: credentials?.protocol || null,
  })
})

// Get all conversations
app.get('/conversations', async (c) => {
  try {
    const conversations = await getConversations()
    return c.json({ success: true, conversations })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get lobby chat ID
app.get('/lobby-id', async (c) => {
  try {
    const lobbyId = await getLobbyConversationId()
    return c.json({ success: true, lobbyId })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Send message to lobby chat
app.post('/send-message', async (c) => {
  try {
    const { message } = await c.req.json()

    if (!message || typeof message !== 'string') {
      return c.json({ success: false, error: 'Message is required' }, 400)
    }

    const lobbyId = await getLobbyConversationId()

    if (!lobbyId) {
      return c.json({ success: false, error: 'Lobby chat not found. Are you in a lobby?' }, 404)
    }

    await lcuRequest(`/lol-chat/v1/conversations/${lobbyId}/messages`, 'POST', {
      body: message,
      type: 'chat',
    })

    return c.json({ success: true, message: 'Message sent successfully' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Send multiple messages
app.post('/send-batch', async (c) => {
  try {
    const { messages, delay = 1000 } = await c.req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return c.json({ success: false, error: 'Messages array is required' }, 400)
    }

    const lobbyId = await getLobbyConversationId()

    if (!lobbyId) {
      return c.json({ success: false, error: 'Lobby chat not found. Are you in a lobby?' }, 404)
    }

    const results = []

    for (const msg of messages) {
      try {
        await lcuRequest(`/lol-chat/v1/conversations/${lobbyId}/messages`, 'POST', {
          body: msg,
          type: 'chat',
        })
        results.push({ message: msg, success: true })

        // Add delay between messages
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } catch (error: any) {
        results.push({ message: msg, success: false, error: error.message })
      }
    }

    return c.json({ success: true, results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// --- Role Sniper Logic ---

interface SniperConfig {
  enabled: boolean
  message: string
  roleId: string // 'mid', 'top', etc.
  lastSnipedLobbyId: string | null
}

let sniperConfig: SniperConfig = {
  enabled: false,
  message: '',
  roleId: '',
  lastSnipedLobbyId: null
}

// Sniper loop
setInterval(async () => {
  if (!sniperConfig.enabled || !sniperConfig.message) return

  try {
    // Quick check for lobby without full logging to avoid spamming stdout
    const conversations = await lcuRequest('/lol-chat/v1/conversations')
    if (!Array.isArray(conversations)) return

    const lobbyChat = conversations.find((conv: any) => 
      conv.type === 'championSelect' || conv.type === 'premade' || conv.type === 'party'
    )

    if (lobbyChat && lobbyChat.id !== sniperConfig.lastSnipedLobbyId) {
      console.log(`🎯 SNIPER: New lobby detected! (${lobbyChat.id})`)
      console.log(`🎯 SNIPER: Sending message: "${sniperConfig.message}"`)
      
      // Attempt to send message
      await lcuRequest(`/lol-chat/v1/conversations/${lobbyChat.id}/messages`, 'POST', {
        body: sniperConfig.message,
        type: 'chat',
      })
      
      console.log(`✅ SNIPER: Message sent!`)
      sniperConfig.lastSnipedLobbyId = lobbyChat.id
    }
  } catch (error) {
    // Silent fail in loop to avoid log spam
  }
}, 200) // Check every 200ms

// Sniper Endpoints

// Get sniper status
app.get('/sniper/status', (c) => {
  return c.json({ 
    success: true, 
    enabled: sniperConfig.enabled, 
    message: sniperConfig.message,
    roleId: sniperConfig.roleId 
  })
})

// Configure sniper
app.post('/sniper/config', async (c) => {
  try {
    const body = await c.req.json()
    const { enabled, message, roleId } = body
    
    if (typeof enabled === 'boolean') sniperConfig.enabled = enabled
    if (typeof message === 'string') sniperConfig.message = message
    if (typeof roleId === 'string') sniperConfig.roleId = roleId

    // Reset last sniped lobby if disabling or changing config significantly
    // but usually we want to keep it to avoid re-sniping same lobby if just toggling
    
    console.log(`⚙️ SNIPER: Config updated - Enabled: ${sniperConfig.enabled}, Msg: ${sniperConfig.message}`)
    
    return c.json({ success: true, config: sniperConfig })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// Start server
console.log(`🎮 LCU API Service starting on port ${PORT}...`)

serve({
  fetch: app.fetch,
  port: PORT
})

console.log(`✅ LCU API Service is running on http://localhost:${PORT}`)
console.log(`\n📡 Available endpoints:`)
console.log(`   GET  /health - Health check`)
console.log(`   GET  /status - Check if LoL client is connected`)
console.log(`   GET  /conversations - Get all chat conversations`)
console.log(`   GET  /lobby-id - Get lobby chat ID`)
console.log(`   POST /send-message - Send message to lobby chat`)
console.log(`   POST /send-batch - Send multiple messages to lobby chat`)
console.log(`\n⚠️  Make sure League of Legends client is running!`)
