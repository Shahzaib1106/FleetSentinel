import { useEffect, useRef, useState } from 'react'

const WS_URL =
  import.meta.env.VITE_WS_URL ||
  'ws://127.0.0.1:8000/ws/fleet'

export function useFleetSocket() {
  const [ships, setShips] = useState([])
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)

  const socketRef = useRef(null)

  useEffect(() => {
    const socket = new WebSocket(WS_URL)

    socketRef.current = socket

    socket.onopen = () => {
      console.log('Fleet WebSocket connected')
      setConnected(true)
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'fleet_update') {
          setShips(data.ships || [])
          setLastUpdate(new Date())
        }
      } catch (error) {
        console.error('Invalid WebSocket message:', error)
      }
    }

    socket.onclose = () => {
      console.log('Fleet WebSocket disconnected')
      setConnected(false)
    }

    socket.onerror = (error) => {
      console.error('Fleet WebSocket error:', error)
      setConnected(false)
    }

    return () => {
      socket.close()
    }
  }, [])

  return {
    ships,
    connected,
    lastUpdate,
  }
}