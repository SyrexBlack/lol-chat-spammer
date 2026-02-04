'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Sparkles, Copy, Plus, Trash2, RefreshCw, Settings, Zap, Link2, Wifi, WifiOff, Play, Square } from 'lucide-react'

interface Message {
  id: string
  content: string
  category: 'funny' | 'emoji' | 'taunt' | 'custom'
  enabled: boolean
}

interface LCUStatus {
  connected: boolean
  port: number | null
  protocol: string | null
  lobbyId?: string | null
  error?: string
}

const DEFAULT_MESSAGES: Message[] = [
  // ... (keep existing)
  { id: '1', content: '🏆Ranked is just a number', category: 'funny', enabled: true },
  { id: '2', content: '💪 No tilt, only skill', category: 'funny', enabled: true },
  { id: '3', content: '🎯 One trick, one dream', category: 'funny', enabled: true },
  { id: '4', content: '⚡ Fastest fingers in the lobby', category: 'funny', enabled: true },
  { id: '5', content: '🤖 AI predicts: WIN', category: 'funny', enabled: true },
  { id: '6', content: '🎮 GLHF everyone!', category: 'funny', enabled: true },
  { id: '7', content: '🔥 Burning through the ranks', category: 'taunt', enabled: true },
  { id: '8', content: '💀 Fear the gap', category: 'taunt', enabled: true },
  { id: '9', content: '👑 Bow to the carry', category: 'taunt', enabled: false },
  { id: '10', content: '😤 Tryhard mode: ON', category: 'taunt', enabled: false },
  { id: '11', content: '🎉 LETS GOOOOO', category: 'emoji', enabled: true },
  { id: '12', content: '🚀🚀🚀', category: 'emoji', enabled: true },
  { id: '13', content: '💀💀💀', category: 'emoji', enabled: true },
  { id: '14', content: '🔥🔥🔥', category: 'emoji', enabled: true },
  { id: '15', content: '⚔️⚔️⚔️', category: 'emoji', enabled: true },
  { id: '16', content: '🏆🏆🏆', category: 'emoji', enabled: true },
  { id: '17', content: '💪✨', category: 'emoji', enabled: true },
  { id: '18', content: '🎯💥', category: 'emoji', enabled: true },
  { id: '19', content: '🌟🌟🌟', category: 'emoji', enabled: true },
  { id: '20', content: '⚡💨', category: 'emoji', enabled: true },
]

export default function Home() {
  const [messages, setMessages] = useState<Message[]>(DEFAULT_MESSAGES)
  const [newMessage, setNewMessage] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [isSending, setIsSending] = useState(false)
  const [lastSentMessage, setLastSentMessage] = useState<string>('')
  
  // LCU Integration states
  const [lcuStatus, setLcuStatus] = useState<LCUStatus>({ connected: false, port: null, protocol: null, lobbyId: null })
  const [isAutoSpam, setIsAutoSpam] = useState(false)
  const [spamInterval, setSpamInterval] = useState(3)
  const autoSpamRef = useRef<NodeJS.Timeout | null>(null)

  const filteredMessages = activeCategory === 'all' 
    ? messages 
    : messages.filter(m => m.category === activeCategory)

  const enabledMessages = messages.filter(m => m.enabled)

  // Check LCU connection status
  const checkLCUStatus = async () => {
    try {
      const response = await fetch('/api/lcu/status?XTransformPort=3003')
      if (!response.ok) throw new Error('Status fetch failed')
      
      const data = await response.json()
      
      let lobbyId = null
      if (data.connected) {
         try {
           const lobbyRes = await fetch('/api/lcu/lobby-id?XTransformPort=3003')
           if (lobbyRes.ok) {
             const lobbyData = await lobbyRes.json()
             lobbyId = lobbyData.success ? lobbyData.lobbyId : null
           }
         } catch (e) {
           console.error('Failed to fetch lobby ID', e)
         }
      }

      setLcuStatus({ ...data, lobbyId })
    } catch (error) {
      setLcuStatus({ connected: false, port: null, protocol: null, lobbyId: null, error: 'Failed to connect' })
    }
  }

  // Send message via LCU API
  const sendViaLCU = async (message: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/lcu/send?XTransformPort=3003', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Failed to send via LCU:', error)
      return false
    }
  }

  // Check LCU status on mount
  useEffect(() => {
    checkLCUStatus()
    const interval = setInterval(checkLCUStatus, 5000) // Check every 5 seconds
    return () => clearInterval(interval)
  }, [])

  // Auto spam effect
  useEffect(() => {
    if (isAutoSpam && enabledMessages.length > 0 && lcuStatus.connected) {
      autoSpamRef.current = setInterval(async () => {
        const randomMessage = enabledMessages[Math.floor(Math.random() * enabledMessages.length)]
        const success = await sendViaLCU(randomMessage.content)
        if (success) {
          setLastSentMessage(randomMessage.content)
        }
      }, spamInterval * 1000)
    } else {
      if (autoSpamRef.current) {
        clearInterval(autoSpamRef.current)
        autoSpamRef.current = null
      }
    }

    return () => {
      if (autoSpamRef.current) {
        clearInterval(autoSpamRef.current)
      }
    }
  }, [isAutoSpam, spamInterval, enabledMessages, lcuStatus.connected])

  const handleAddMessage = () => {
    if (!newMessage.trim()) return
    
    const message: Message = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      category: 'custom',
      enabled: true
    }
    
    setMessages([...messages, message])
    setNewMessage('')
  }

  const handleDeleteMessage = (id: string) => {
    setMessages(messages.filter(m => m.id !== id))
  }

  const handleToggleMessage = (id: string) => {
    setMessages(messages.map(m => 
      m.id === id ? { ...m, enabled: !m.enabled } : m
    ))
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    setLastSentMessage(content)
  }

  const handleSendRandom = async () => {
    if (enabledMessages.length === 0) return

    const randomMessage = enabledMessages[Math.floor(Math.random() * enabledMessages.length)]
    
    if (lcuStatus.connected) {
      setIsSending(true)
      const success = await sendViaLCU(randomMessage.content)
      if (success) {
        setLastSentMessage(randomMessage.content)
      }
      setTimeout(() => setIsSending(false), 500)
    } else {
      handleCopyMessage(randomMessage.content)
    }
  }

  const handleCopyAll = () => {
    const allEnabled = enabledMessages.map(m => m.content).join('\n')
    navigator.clipboard.writeText(allEnabled)
  }

  const handleSendBatch = async () => {
    if (enabledMessages.length === 0 || !lcuStatus.connected) return

    setIsSending(true)
    for (const msg of enabledMessages) {
      await sendViaLCU(msg.content)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    setIsSending(false)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'funny': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
      case 'emoji': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
      case 'taunt': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
      case 'custom': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'funny': return '😄 Прикол'
      case 'emoji': return '😎 Эмодзи'
      case 'taunt': return '😤 Троллинг'
      case 'custom': return '✏️ Свой'
      default: return category
    }
  }

  // --- Sniper Logic ---
  const [sniperConfig, setSniperConfig] = useState({
    enabled: false,
    roleId: '', // 'mid', 'top', etc.
    message: ''
  })
  const [isSniperLoading, setIsSniperLoading] = useState(false)

  const ROLES = [
    { id: 'top', label: 'Top', message: 'top', icon: '🛡️' },
    { id: 'jungle', label: 'Jungle', message: 'jungle', icon: '🌲' },
    { id: 'mid', label: 'Mid', message: 'mid', icon: '⚔️' },
    { id: 'adc', label: 'ADC', message: 'adc', icon: '🏹' },
    { id: 'sup', label: 'Sup', message: 'sup', icon: '❤️' },
  ]

  const fetchSniperStatus = async () => {
    try {
      const response = await fetch('http://localhost:3003/sniper/status')
      const data = await response.json()
      if (data.success) {
        setSniperConfig({
          enabled: data.enabled,
          roleId: data.roleId || '',
          message: data.message || ''
        })
      }
    } catch (e) {
      console.error('Failed to fetch sniper status', e)
    }
  }

  const updateSniperConfig = async (newConfig: Partial<typeof sniperConfig>) => {
    setIsSniperLoading(true)
    try {
      const mergedConfig = { ...sniperConfig, ...newConfig }
      if (newConfig.roleId) {
         const role = ROLES.find(r => r.id === newConfig.roleId)
         if (role) mergedConfig.message = role.message
      }

      const response = await fetch('http://localhost:3003/sniper/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mergedConfig)
      })
      const data = await response.json()
      if (data.success) {
        setSniperConfig(c => ({ ...c, ...mergedConfig }))
      }
    } catch (e) {
      console.error('Failed to update sniper config', e)
    } finally {
      setIsSniperLoading(false)
    }
  }

  useEffect(() => {
    fetchSniperStatus()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-amber-500/20 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Zap className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                  LoL Chat Spammer
                </h1>
                <p className="text-xs text-slate-400">Приколы и эмодзи для лобби</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700">
                {lcuStatus.connected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400">LoL подключен</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400">LoL не подключен</span>
                  </>
                )}
              </div>
              <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                v2.0
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 pb-24">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Messages List */}
          <div className="lg:col-span-2 space-y-6">
            {/* LCU Status Card */}
            <Card className={`bg-slate-900/50 border ${lcuStatus.connected ? 'border-green-500/30' : 'border-red-500/30'}`}>
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-amber-400" />
                  Статус подключения к League of Legends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className={`text-sm font-medium ${lcuStatus.connected ? 'text-green-400' : 'text-red-400'}`}>
                      {lcuStatus.connected ? '✓ Клиент League of Legends подключен' : '✗ Клиент не найден'}
                    </p>
                    {lcuStatus.port && (
                      <p className="text-xs text-slate-400">Порт: {lcuStatus.port} ({lcuStatus.protocol})</p>
                    )}
                    {lcuStatus.connected && (
                      <p className="text-xs text-slate-400 mt-1">Lobby ID: <span className="text-slate-200">{lcuStatus.lobbyId || 'Не найдено'}</span></p>
                    )}
                    {!lcuStatus.connected && (
                      <p className="text-xs text-slate-500 mt-2">
                        Убедитесь, что League of Legends запущен и вы находитесь в лобби
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={checkLCUStatus}
                    disabled={isSending}
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isSending ? 'animate-spin' : ''}`} />
                    Проверить
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Role Sniper Card */}
            <Card className={`bg-slate-900/50 border ${sniperConfig.enabled ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-slate-800'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${sniperConfig.enabled ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400'}`}>
                      <Zap className="w-4 h-4" />
                    </div>
                    Role Sniper (Авто-выбор)
                  </CardTitle>
                  <Switch
                    checked={sniperConfig.enabled}
                    onCheckedChange={(checked) => updateSniperConfig({ enabled: checked })}
                    disabled={!lcuStatus.connected || !sniperConfig.roleId}
                  />
                </div>
                <CardDescription className="text-slate-400">
                  Автоматически пишет роль в чат при входе в лобби (быстрее всех!)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {!lcuStatus.connected && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                      <p className="text-xs text-red-400">⚠️ Требуется подключение к LoL</p>
                    </div>
                 )}
                 
                 <div className="grid grid-cols-5 gap-2">
                    {ROLES.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => updateSniperConfig({ roleId: role.id })}
                        disabled={!lcuStatus.connected}
                        className={`
                          flex flex-col items-center justify-center p-3 rounded-lg border transition-all
                          ${sniperConfig.roleId === role.id 
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400' 
                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-800'}
                          ${!lcuStatus.connected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        <span className="text-xl mb-1">{role.icon}</span>
                        <span className="text-xs font-semibold">{role.label}</span>
                      </button>
                    ))}
                 </div>

                 {sniperConfig.roleId && (
                   <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-950/30 p-2 rounded border border-slate-800">
                     <span className="text-amber-500">Сообщение:</span>
                     <code className="text-slate-300 font-mono">{sniperConfig.message}</code>
                   </div>
                 )}
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      Сообщения
                    </CardTitle>
                    <CardDescription className="text-slate-400 mt-1">
                      Выберите сообщения для использования в чате
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {enabledMessages.length} активных
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
                    <TabsTrigger value="all" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                      Все
                    </TabsTrigger>
                    <TabsTrigger value="funny" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
                      Приколы
                    </TabsTrigger>
                    <TabsTrigger value="emoji" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                      Эмодзи
                    </TabsTrigger>
                    <TabsTrigger value="taunt" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
                      Троллинг
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value={activeCategory} className="mt-4">
                    <ScrollArea className="h-96 pr-4">
                      <div className="space-y-3">
                        {filteredMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`p-4 rounded-lg border transition-all ${
                              message.enabled
                                ? 'bg-slate-800/50 border-slate-700 hover:border-amber-500/50'
                                : 'bg-slate-900/30 border-slate-800 opacity-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className={`text-xs ${getCategoryColor(message.category)}`}>
                                    {getCategoryLabel(message.category)}
                                  </Badge>
                                </div>
                                <p className="text-white text-sm break-words">{message.content}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Switch
                                  checked={message.enabled}
                                  onCheckedChange={() => handleToggleMessage(message.id)}
                                />
                                {lcuStatus.connected && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => sendViaLCU(message.content)}
                                    className="h-8 w-8 p-0 text-green-400 hover:text-green-300"
                                    title="Отправить в чат"
                                  >
                                    <Send className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopyMessage(message.content)}
                                  className="h-8 w-8 p-0"
                                  title="Копировать"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-amber-400" />
                  Быстрые действия
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Button
                    onClick={handleSendRandom}
                    disabled={isSending || enabledMessages.length === 0}
                    className={`font-semibold ${lcuStatus.connected 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white' 
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900'}`}
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        {lcuStatus.connected ? 'Отправляем...' : 'Копируем...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {lcuStatus.connected ? 'Отправить в чат' : 'Случайное сообщение'}
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCopyAll}
                    variant="outline"
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Копировать все
                  </Button>
                </div>
                
                {lcuStatus.connected && (
                  <Button
                    onClick={handleSendBatch}
                    disabled={isSending || enabledMessages.length === 0}
                    variant="outline"
                    className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Отправить все активные ({enabledMessages.length})
                  </Button>
                )}

                {lastSentMessage && (
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">
                      {lcuStatus.connected ? 'Последнее отправленное:' : 'Последнее скопированное:'}
                    </p>
                    <p className="text-white text-sm font-mono">{lastSentMessage}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Settings & Add New */}
          <div className="space-y-6">
            {/* Auto Spam Control */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {isAutoSpam ? <Square className="w-5 h-5 text-red-400" /> : <Play className="w-5 h-5 text-green-400" />}
                  Авто-спам
                </CardTitle>
                <CardDescription className="text-slate-400 mt-1">
                  Автоматически отправлять сообщения в чат
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!lcuStatus.connected ? (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-400">
                      ⚠️ Требуется подключение к League of Legends
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-slate-300">Статус</Label>
                        <p className="text-xs text-slate-500 mt-1">
                          {isAutoSpam ? 'Авто-спам активен' : 'Авто-спам остановлен'}
                        </p>
                      </div>
                      <Button
                        onClick={() => setIsAutoSpam(!isAutoSpam)}
                        disabled={enabledMessages.length === 0}
                        variant={isAutoSpam ? "destructive" : "default"}
                        className={isAutoSpam ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
                      >
                        {isAutoSpam ? (
                          <>
                            <Square className="w-4 h-4 mr-2" />
                            Остановить
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Запустить
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <Label htmlFor="spam-interval" className="text-slate-300">
                        Интервал: {spamInterval} сек
                      </Label>
                      <Input
                        id="spam-interval"
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={spamInterval}
                        onChange={(e) => setSpamInterval(Number(e.target.value))}
                        disabled={isAutoSpam}
                        className="bg-slate-800/50 border-slate-700"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>1 сек</span>
                        <span>10 сек</span>
                      </div>
                    </div>

                    {isAutoSpam && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-xs text-green-400">
                          ✓ Отправка сообщений каждые {spamInterval} секунд
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Add New Message */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  Добавить сообщение
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-message" className="text-slate-300">
                    Текст сообщения
                  </Label>
                  <Textarea
                    id="new-message"
                    placeholder="Введите ваше сообщение..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px]"
                  />
                </div>
                <Button
                  onClick={handleAddMessage}
                  disabled={!newMessage.trim()}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить
                </Button>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-400" />
                  Статистика
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Всего сообщений:</span>
                    <span className="text-white">{messages.length}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Активных:</span>
                    <span className="text-amber-400">{enabledMessages.length}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Приколов:</span>
                    <span className="text-yellow-400">{messages.filter(m => m.category === 'funny').length}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Эмодзи:</span>
                    <span className="text-purple-400">{messages.filter(m => m.category === 'emoji').length}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Троллинг:</span>
                    <span className="text-red-400">{messages.filter(m => m.category === 'taunt').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-amber-200 font-medium">💡 Как использовать:</p>
                  <ul className="text-xs text-amber-100/80 space-y-1 list-disc list-inside">
                    <li>Запустите League of Legends</li>
                    <li>Войдите в лобби или champion select</li>
                    <li>Подождите подключения (зеленый индикатор)</li>
                    <li>Включите нужные сообщения</li>
                    <li>Используйте авто-спам или отправляйте вручную</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-500/20 bg-slate-900/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <p>LoL Chat Spammer с LCU интеграцией</p>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>GLHF</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
