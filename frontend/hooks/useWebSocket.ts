'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface WebSocketOptions {
  autoConnect?: boolean
  channels?: string[]
}

interface ValidationProgress {
  jobId: number
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  progressCurrent: number
  progressTotal: number
  progressPercentage: number
  currentConcurso?: number
  currentStrategy?: string
  message?: string
  error?: string
  hits?: {
    concurso: number
    strategy: string
    hits: number
  }
  statistics?: {
    totalPredictions: number
    totalHits: number
    avgHits: number
    bestStrategyId: number
    bestHitCount: number
  }
}

interface SignificantHit {
  lotteryType: string
  jobId: number
  concurso: number
  strategyName: string
  hits: number
  predictedNumbers: number[]
  matchedNumbers: number[]
}

export function useWebSocket(options: WebSocketOptions = {}) {
  const { autoConnect = true, channels = [] } = options
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)

  // Event handlers storage
  const handlersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map())

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'

    socketRef.current = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current.on('connect', () => {
      setIsConnected(true)
      console.log('WebSocket connected')
    })

    socketRef.current.on('connected', (data: { clientId: string }) => {
      setClientId(data.clientId)

      // Subscribe to default channels
      channels.forEach(channel => {
        socketRef.current?.emit('subscribe', { channel })
      })
    })

    socketRef.current.on('disconnect', () => {
      setIsConnected(false)
      console.log('WebSocket disconnected')
    })

    // Forward events to registered handlers
    socketRef.current.onAny((event: string, data: unknown) => {
      const handlers = handlersRef.current.get(event)
      if (handlers) {
        handlers.forEach(handler => handler(data))
      }
    })
  }, [channels])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }, [])

  const subscribe = useCallback((channel: string) => {
    socketRef.current?.emit('subscribe', { channel })
  }, [])

  const unsubscribe = useCallback((channel: string) => {
    socketRef.current?.emit('unsubscribe', { channel })
  }, [])

  const on = useCallback((event: string, handler: (data: any) => void) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set())
    }
    handlersRef.current.get(event)!.add(handler)

    return () => {
      handlersRef.current.get(event)?.delete(handler)
    }
  }, [])

  const off = useCallback((event: string, handler?: (data: any) => void) => {
    if (handler) {
      handlersRef.current.get(event)?.delete(handler)
    } else {
      handlersRef.current.delete(event)
    }
  }, [])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return {
    isConnected,
    clientId,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    on,
    off,
    socket: socketRef.current,
  }
}

// Hook specifically for validation progress
export function useValidationProgress(jobId?: number) {
  const [progress, setProgress] = useState<ValidationProgress | null>(null)
  const [significantHits, setSignificantHits] = useState<SignificantHit[]>([])
  const { isConnected, subscribe, on, off } = useWebSocket({
    autoConnect: true,
    channels: ['validation']
  })

  useEffect(() => {
    if (!isConnected) return

    // Subscribe to specific job channel if provided
    if (jobId) {
      subscribe(`validation:${jobId}`)
    }

    // Listen for progress updates
    const handleProgress = (data: ValidationProgress) => {
      if (!jobId || data.jobId === jobId) {
        setProgress(data)

        // Track significant hits
        if (data.hits && data.hits.hits >= 4) {
          setSignificantHits(prev => [
            {
              lotteryType: '', // Will be filled from event
              jobId: data.jobId,
              concurso: data.hits!.concurso,
              strategyName: data.hits!.strategy,
              hits: data.hits!.hits,
              predictedNumbers: [],
              matchedNumbers: [],
            },
            ...prev.slice(0, 49), // Keep last 50
          ])
        }
      }
    }

    const handleComplete = (data: any) => {
      if (!jobId || data.jobId === jobId) {
        setProgress(prev => prev ? { ...prev, status: 'completed', ...data } : null)
      }
    }

    const handleSignificantHit = (data: SignificantHit) => {
      if (!jobId || data.jobId === jobId) {
        setSignificantHits(prev => [data, ...prev.slice(0, 49)])
      }
    }

    const unsubProgress = on('validationProgress', handleProgress)
    const unsubComplete = on('validationComplete', handleComplete)
    const unsubHit = on('significantHit', handleSignificantHit)

    return () => {
      unsubProgress()
      unsubComplete()
      unsubHit()
    }
  }, [isConnected, jobId, subscribe, on])

  const reset = useCallback(() => {
    setProgress(null)
    setSignificantHits([])
  }, [])

  return {
    progress,
    significantHits,
    isConnected,
    reset,
  }
}
