// Rota para webhook do Asaas (singular) - processa eventos de pagamento e assinatura
import { NextRequest, NextResponse } from 'next/server'
import { AsaasSubscriptionService } from '@/lib/services/asaasSubscriptionService'
import type { WebhookEvent } from '@/types/subscription'

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString()
  
  try {
    // Capturar headers do webhook
    const headers = Object.fromEntries(request.headers.entries())
    
    // Parse do body do webhook
    const body = await request.text()
    
    console.log('🔔 [WEBHOOK RECEIVED - SINGULAR ROUTE]', {
      timestamp,
      method: request.method,
      url: request.url,
      headers: {
        ...headers,
        // Mascarar headers sensíveis se existirem
        authorization: headers.authorization ? '***HIDDEN***' : undefined
      },
      bodyRaw: body,
      bodyLength: body.length
    })

    let webhookData: WebhookEvent
    try {
      webhookData = JSON.parse(body)
    } catch (parseError) {
      console.error('❌ [WEBHOOK PARSE ERROR]', {
        timestamp,
        error: parseError,
        bodyRaw: body
      })
      throw new Error('Formato de JSON inválido no webhook')
    }

    console.log('📋 [WEBHOOK PARSED DATA]', {
      timestamp,
      event: webhookData.event,
      dateCreated: webhookData.dateCreated,
      fullPayload: webhookData
    })

    // Processar o webhook
    console.log('⚙️ [WEBHOOK PROCESSING]', {
      timestamp,
      event: webhookData.event,
      status: 'starting'
    })

    await AsaasSubscriptionService.processWebhook(webhookData.event, webhookData)

    console.log('✅ [WEBHOOK SUCCESS]', {
      timestamp,
      event: webhookData.event,
      status: 'completed'
    })

    return NextResponse.json({ 
      message: 'Webhook processado com sucesso',
      event: webhookData.event,
      timestamp
    }, { status: 200 })

  } catch (error) {
    console.error('💥 [WEBHOOK ERROR]', {
      timestamp,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp
    }, { status: 500 })
  }
}

// Método GET para verificação de saúde
export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook endpoint (singular) está funcionando',
    timestamp: new Date().toISOString()
  })
}
