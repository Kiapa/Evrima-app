import { WS_URL } from '@/constants'
import { getAccessToken } from '@/lib/supabase'
import type { PositionUpdateMessage } from '@/types'

type MessageHandler = (msg: PositionUpdateMessage) => void

class TrackrWebSocket {
  private ws: WebSocket | null = null
  private handlers: Set<MessageHandler> = new Set()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private shouldReconnect = false

  async connect(): Promise<void> {
    const token = await getAccessToken()
    if (!token) return

    this.shouldReconnect = true
    this._open(token)
  }

  private _open(token: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) return

    this.ws = new WebSocket(`${WS_URL}?token=${token}`)

    this.ws.onopen = () => {
      console.log('[WS] Connected')
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }
    }

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as PositionUpdateMessage
        if (msg.type === 'position_update') {
          this.handlers.forEach(h => h(msg))
        }
      } catch {
        // Malformed message — ignore
      }
    }

    this.ws.onclose = () => {
      console.log('[WS] Disconnected')
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this.connect(), 3000)
      }
    }

    this.ws.onerror = (e) => {
      console.warn('[WS] Error', e)
    }
  }

  disconnect(): void {
    this.shouldReconnect = false
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
  }

  subscribe(handler: MessageHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Singleton — one connection shared across the whole app
export const trackrWS = new TrackrWebSocket()
