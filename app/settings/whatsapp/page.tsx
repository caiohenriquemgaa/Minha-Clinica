'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'

export default function WhatsAppSettings() {
  const router = useRouter()
  const [status, setStatus] = useState<'scanning' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [qr, setQr] = useState<string | null>(null)
  const [phone, setPhone] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  // Get token from session
  useEffect(() => {
    const getToken = async () => {
      try {
        const response = await fetch('/api/auth/session', { credentials: 'include' })
        const session = await response.json()
        const jwt = (session as any)?.access_token || (session as any)?.user?.user_metadata?.token
        setToken(jwt)
      } catch (error) {
        console.error('Failed to get token:', error)
      }
    }
    getToken()
  }, [])

  // Poll status
  useEffect(() => {
    if (!token) return

    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/whatsapp/status', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          console.error('Failed to fetch status')
          return
        }

        const data = await res.json()
        setStatus(data.status)
        setQr(data.qr)
        setPhone(data.phone)
      } catch (error) {
        console.error('Error fetching status:', error)
      }
    }

    // Poll a cada 2 segundos quando está scanning
    const interval = setInterval(fetchStatus, 2000)
    return () => clearInterval(interval)
  }, [token, polling])

  const handleConnect = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        alert('Erro ao conectar WhatsApp')
        return
      }

      setPolling(true)
    } catch (error) {
      console.error('Error:', error)
      alert('Erro ao conectar WhatsApp')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Desconectar WhatsApp?')) return

    try {
      const res = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (res.ok) {
        setStatus('disconnected')
        setQr(null)
        setPhone(null)
        setPolling(false)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Configurar WhatsApp</h1>

      <div className="bg-white rounded-lg shadow p-6">
        {status === 'disconnected' && (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Conecte seu número de WhatsApp para enviar lembretes automaticamente
            </p>
            <button
              onClick={handleConnect}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
            >
              {loading ? 'Carregando...' : 'Conectar WhatsApp'}
            </button>
          </div>
        )}

        {status === 'scanning' && (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Escaneie o código abaixo com seu WhatsApp</h2>
            {qr ? (
              <div className="flex justify-center mb-4">
                <QRCodeSVG value={qr} size={256} level="H" />
              </div>
            ) : (
              <div className="flex justify-center mb-4">
                <div className="text-gray-400">Gerando QR Code...</div>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Use o seu celular para escanear este código
            </p>
          </div>
        )}

        {status === 'connected' && (
          <div className="bg-green-50 border border-green-200 rounded p-6">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <h2 className="text-lg font-semibold text-green-700">Conectado com sucesso!</h2>
            </div>
            {phone && (
              <p className="text-gray-700 mb-4">
                <strong>Número:</strong> {phone}
              </p>
            )}
            <p className="text-sm text-gray-600 mb-6">
              Seu WhatsApp está conectado. Os lembretes serão enviados automaticamente para os pacientes.
            </p>
            <button
              onClick={handleDisconnect}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
            >
              Desconectar
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded p-6">
            <h2 className="text-lg font-semibold text-red-700 mb-2">Erro ao conectar</h2>
            <p className="text-gray-700 mb-4">
              Ocorreu um erro ao tentar conectar seu WhatsApp. Tente novamente.
            </p>
            <button
              onClick={handleConnect}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Tentar Novamente
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Informações</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• O WhatsApp será mantido conectado para enviar lembretes automaticamente</li>
          <li>• Você pode usar seu WhatsApp normalmente enquanto está conectado</li>
          <li>• Os lembretes são enviados 24 horas e 2 horas antes do agendamento</li>
          <li>• Você pode desconectar a qualquer momento</li>
        </ul>
      </div>
    </div>
  )
}
