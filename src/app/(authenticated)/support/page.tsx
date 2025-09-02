'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { MessageCircle, Phone, Mail, Clock, Send } from 'lucide-react'

export default function SupportPage() {
  const [problemDescription, setProblemDescription] = useState('')
  const [userName, setUserName] = useState('')

  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const handleSubmit = () => {
    if (!problemDescription.trim()) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Por favor, descreva o problema que você está enfrentando'
      })
      return
    }

    if (!userName.trim()) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Por favor, informe seu nome'
      })
      return
    }

    // Criar mensagem para WhatsApp
    const message = `Olá! Sou ${userName} e estou com um problema no sistema:

${problemDescription}

Poderia me ajudar?`

    // Codificar mensagem para URL
    const encodedMessage = encodeURIComponent(message)

    // Abrir WhatsApp
    const whatsappUrl = `https://wa.me/5573988389770?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')

    addToast({
      type: 'success',
      title: 'Sucesso',
      message: 'Redirecionando para o WhatsApp...'
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Suporte</h1>
        <p className="text-gray-600">
          Precisa de ajuda? Entre em contato conosco diretamente pelo WhatsApp
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Card Principal - Formulário e Contato */}
        <div className="lg:col-span-2">
          <Card className="border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                <span>Entre em Contato</span>
              </CardTitle>
              <CardDescription>
                Preencha o formulário abaixo ou entre em contato diretamente pelo WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Formulário */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Descreva seu Problema</h3>

                  {/* Nome */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Seu Nome *
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Digite seu nome completo"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Descrição do Problema */}
                  <div>
                    <label htmlFor="problem" className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição do Problema *
                    </label>
                    <textarea
                      id="problem"
                      rows={6}
                      placeholder="Descreva detalhadamente o problema que você está enfrentando..."
                      value={problemDescription}
                      onChange={(e) => setProblemDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Botão Enviar */}
                  <Button
                    onClick={handleSubmit}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? 'Enviando...' : 'Enviar para WhatsApp'}
                  </Button>
                </div>

                {/* Contato Direto */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contato Direto</h3>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">WhatsApp</p>
                        <p className="text-sm text-gray-600">(73) 998838-9770</p>
                        <p className="text-xs text-gray-500">Resposta rápida e personalizada</p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700"
                      onClick={() => window.open('https://wa.me/5573988389770', '_blank')}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Abrir WhatsApp Diretamente
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações Adicionais - Lado Direito */}
        <div className="space-y-6">
          {/* Horário de Atendimento */}
          <Card className="border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Horário de Atendimento</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Segunda a Sexta:</strong> 8h às 18h
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Sábado:</strong> 8h às 12h
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Domingo:</strong> Fechado
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dicas */}
          <Card className="border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">💡 Dicas para um Atendimento Mais Rápido</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Descreva o problema de forma clara e detalhada</li>
                <li>• Inclua mensagens de erro, se houver</li>
                <li>• Se possível, anexe prints ou vídeos</li>
                <li>• Mantenha o WhatsApp aberto para resposta rápida</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
