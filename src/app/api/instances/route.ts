import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Configuração server-side (segura)
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL

// Função para mapear status da Evolution API para nosso sistema
function mapEvolutionStatus(evolutionStatus: string): string {
  switch (evolutionStatus?.toLowerCase()) {
    case 'open':
      return 'open'
    case 'close':
      return 'close'
    case 'connecting':
      return 'connecting'
    default:
      return 'close'
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticar usuário
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Não precisamos setar cookies aqui
          }
        }
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🔧 API Route: Tentativa de autenticação:', { user: user?.id, error: authError })
    
    if (authError || !user) {
      console.error('❌ API Route: Falha na autenticação:', authError)
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.log('✅ API Route: Usuário autenticado:', user.id)

    // 2. Verificar se usuário já tem instância
    const { data: existingInstance } = await supabase
      .from('instances')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    if (existingInstance && existingInstance.length > 0) {
      return NextResponse.json(
        { error: 'Usuário já possui uma instância' },
        { status: 400 }
      )
    }

    // 3. Obter dados do request
    const { instanceName, phoneNumber } = await request.json()
    
    if (!instanceName || !phoneNumber) {
      return NextResponse.json(
        { error: 'Nome da instância e telefone são obrigatórios' },
        { status: 400 }
      )
    }

    // 4. Verificar variáveis de ambiente
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      console.error('❌ Variáveis de ambiente da Evolution API não configuradas')
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    // 5. Criar instância na Evolution API
    const evolutionResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        instanceName,
        integration: "WHATSAPP-BAILEYS",
        rejectCall: true,
        qrcode: true,
        readStatus: false,
        readMessages: false,
        syncFullHistory: false,
        webhook: {
          url: N8N_WEBHOOK_URL || "",
          base64: false,
          events: ["MESSAGES_UPSERT"]
        }
      })
    })

    if (!evolutionResponse.ok) {
      const errorData = await evolutionResponse.json()
      console.error('❌ Erro ao criar instância na Evolution API:', errorData)
      return NextResponse.json(
        { error: `Falha ao criar instância: ${errorData.message || 'Erro desconhecido'}` },
        { status: 500 }
      )
    }

    const evolutionData = await evolutionResponse.json()
    console.log('✅ Evolution API: Instância criada:', evolutionData)

    // 6. Criar instância no banco de dados
    const instanceData = {
      user_id: user.id,
      instance_name: instanceName,
      status: mapEvolutionStatus(evolutionData.instance?.status) || 'error',
      qr_code: evolutionData.qrcode?.base64 || null,
      evolution_instance_id: evolutionData.instance?.instanceName || instanceName
    }

    const { data: newInstance, error: dbError } = await supabase
      .from('instances')
      .insert([instanceData])
      .select()
      .single()

    if (dbError) {
      console.error('❌ Erro ao criar instância no banco:', dbError)
      // TODO: Rollback - deletar instância da Evolution API
      return NextResponse.json(
        { error: 'Falha ao salvar instância no banco' },
        { status: 500 }
      )
    }

    console.log('✅ Banco de dados: Instância salva:', newInstance)
    
    return NextResponse.json({
      success: true,
      instance: newInstance
    })

  } catch (error) {
    console.error('❌ Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 1. Autenticar usuário
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Não precisamos setar cookies aqui
          }
        }
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ API Route PUT: Falha na autenticação:', authError)
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.log('✅ API Route PUT: Usuário autenticado:', user.id)

    // 2. Verificar variáveis de ambiente
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      console.error('❌ Variáveis de ambiente da Evolution API não configuradas')
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    // 3. Obter dados do request
    const { action } = await request.json()
    
    if (action !== 'connect' && action !== 'updateStatus' && action !== 'disconnect') {
      return NextResponse.json(
        { error: 'Ação inválida' },
        { status: 400 }
      )
    }

    // 4. Buscar instância do usuário
    const { data: instance, error: instanceError } = await supabase
      .from('instances')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (instanceError || !instance) {
      console.error('❌ Erro ao buscar instância:', instanceError)
      return NextResponse.json(
        { error: 'Instância não encontrada' },
        { status: 404 }
      )
    }

    // Se for updateStatus, buscar status atual da Evolution API
    if (action === 'updateStatus') {
      console.log('🔍 Atualizando status da instância:', instance.instance_name)
      
      try {
        console.log('🔍 Fazendo requisição para:', `${EVOLUTION_API_URL}/instance/connectionState/${instance.instance_name}`)
        
        const statusResponse = await fetch(
          `${EVOLUTION_API_URL}/instance/connectionState/${instance.instance_name}`,
          {
            method: 'GET',
            headers: {
              'apikey': EVOLUTION_API_KEY
            }
          }
        )

        console.log('🔍 Status da resposta:', statusResponse.status)
        console.log('🔍 Headers da resposta:', Object.fromEntries(statusResponse.headers.entries()))

        if (!statusResponse.ok) {
          const errorData = await statusResponse.json()
          console.error('❌ Erro ao buscar status na Evolution API:', errorData)
          return NextResponse.json(
            { error: `Falha ao buscar status: ${errorData.message || 'Erro desconhecido'}` },
            { status: 500 }
          )
        }

        const statusData = await statusResponse.json()
        console.log('✅ Evolution API: Status obtido (RESPOSTA COMPLETA):', JSON.stringify(statusData, null, 2))
        console.log('🔍 Campo "instance" da resposta:', statusData.instance)
        console.log('🔍 Campo "instance.state" da resposta:', statusData.instance?.state)
        console.log('🔍 Tipo do campo "instance.state":', typeof statusData.instance?.state)

        // Atualizar status no banco de dados
        const mappedStatus = mapEvolutionStatus(statusData.instance?.state)
        console.log('🔍 Status mapeado:', mappedStatus)
        
        const updateData = {
          status: mappedStatus,
          updated_at: new Date().toISOString()
        }

        console.log('🔍 Debug - Dados para atualização de status:', updateData)

        const { data: updatedInstance, error: updateError } = await supabase
          .from('instances')
          .update(updateData)
          .eq('id', instance.id)
          .select()
          .single()

        if (updateError) {
          console.error('❌ Erro ao atualizar status no banco:', updateError)
          return NextResponse.json(
            { error: 'Falha ao atualizar status no banco' },
            { status: 500 }
          )
        }

        console.log('✅ Banco de dados: Status atualizado:', updatedInstance)
        
        return NextResponse.json({
          success: true,
          instance: updatedInstance
        })

      } catch (error) {
        console.error('❌ Erro interno ao atualizar status:', error)
        return NextResponse.json(
          { error: 'Erro interno do servidor' },
          { status: 500 }
        )
      }
    }

    // Se for disconnect, desconectar instância na Evolution API
    if (action === 'disconnect') {
      console.log('🔌 Desconectando instância:', instance.instance_name)
      
      try {
        const disconnectResponse = await fetch(
          `${EVOLUTION_API_URL}/instance/logout/${instance.instance_name}`,
          {
            method: 'DELETE',
            headers: {
              'apikey': EVOLUTION_API_KEY
            }
          }
        )

        if (!disconnectResponse.ok) {
          const errorData = await disconnectResponse.json()
          console.error('❌ Erro ao desconectar instância na Evolution API:', errorData)
          return NextResponse.json(
            { error: `Falha ao desconectar instância: ${errorData.message || 'Erro desconhecido'}` },
            { status: 500 }
          )
        }

        const disconnectData = await disconnectResponse.json()
        console.log('✅ Evolution API: Resposta de desconexão:', disconnectData)
        console.log('🔍 Status da resposta:', disconnectData.status)
        console.log('🔍 Erro da resposta:', disconnectData.error)
        console.log('🔍 Mensagem da resposta:', disconnectData.response?.message)

        // Verificar se a desconexão foi bem-sucedida
        if (disconnectData.status === 'SUCCESS' && !disconnectData.error) {
          console.log('✅ Desconexão bem-sucedida na Evolution API')
          
          // Atualizar status no banco de dados para 'close'
          const updateData = {
            status: 'close',
            qr_code: null, // Limpar QR Code quando desconectado
            updated_at: new Date().toISOString()
          }

          console.log('🔍 Debug - Dados para atualização de desconexão:', updateData)

          const { data: updatedInstance, error: updateError } = await supabase
            .from('instances')
            .update(updateData)
            .eq('id', instance.id)
            .select()
            .single()

          if (updateError) {
            console.error('❌ Erro ao atualizar instância no banco:', updateError)
            return NextResponse.json(
              { error: 'Falha ao atualizar instância no banco' },
              { status: 500 }
            )
          }

          console.log('✅ Banco de dados: Instância desconectada:', updatedInstance)
          
          return NextResponse.json({
            success: true,
            instance: updatedInstance
          })
        } else {
          console.error('❌ Desconexão falhou na Evolution API:', disconnectData)
          return NextResponse.json(
            { error: `Falha na desconexão: ${disconnectData.response?.message || 'Erro desconhecido'}` },
            { status: 500 }
          )
        }

      } catch (error) {
        console.error('❌ Erro interno ao desconectar instância:', error)
        return NextResponse.json(
          { error: 'Erro interno do servidor' },
          { status: 500 }
        )
      }
    }

    // Se for connect, continuar com a lógica existente
    console.log('🔧 Conectando instância:', instance.instance_name)

    // 5. Conectar instância na Evolution API
    const connectResponse = await fetch(
      `${EVOLUTION_API_URL}/instance/connect/${instance.instance_name}`,
      {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      }
    )

    if (!connectResponse.ok) {
      const errorData = await connectResponse.json()
      console.error('❌ Erro ao conectar instância na Evolution API:', errorData)
      return NextResponse.json(
        { error: `Falha ao conectar instância: ${errorData.message || 'Erro desconhecido'}` },
        { status: 500 }
      )
    }

    const connectData = await connectResponse.json()
    console.log('✅ Evolution API: Instância conectada:', connectData)
    console.log('🔍 Debug - Estrutura completa da resposta:', JSON.stringify(connectData, null, 2))
    console.log('🔍 Debug - qrcode field:', connectData.qrcode)
    console.log('🔍 Debug - qrcode.base64:', connectData.qrcode?.base64)
    console.log('🔍 Debug - qrcode.code:', connectData.qrcode?.code)
    
    // Logs adicionais para debug completo
    console.log('🔍 Debug - Status da resposta:', connectResponse.status)
    console.log('🔍 Debug - Headers da resposta:', Object.fromEntries(connectResponse.headers.entries()))
    console.log('🔍 Debug - Tipo de resposta:', typeof connectData)
    console.log('🔍 Debug - Chaves da resposta:', Object.keys(connectData))
    console.log('🔍 Debug - Resposta bruta (string):', JSON.stringify(connectData))
    
    // Verificar se há campos inesperados
    if (connectData.qr) {
      console.log('🔍 Debug - Campo qr encontrado:', connectData.qr)
    }
    if (connectData.qrcode) {
      console.log('🔍 Debug - Campo qrcode encontrado:', connectData.qrcode)
    }
    if (connectData.qrCode) {
      console.log('🔍 Debug - Campo qrCode encontrado:', connectData.qrCode)
    }
    if (connectData.qr_code) {
      console.log('🔍 Debug - Campo qr_code encontrado:', connectData.qr_code)
    }
    if (connectData.base64) {
      console.log('🔍 Debug - Campo base64 encontrado (TAMANHO):', connectData.base64?.length || 0)
      console.log('🔍 Debug - Campo base64 encontrado (INÍCIO):', connectData.base64?.substring(0, 50) + '...')
    }

    // 5.1. Se não retornou QR Code, tentar buscar separadamente
    let qrCodeData = null
    if (!connectData.qrcode?.base64) {
      console.log('🔍 QR Code não retornado, tentando buscar separadamente...')
      
      try {
        const qrResponse = await fetch(
          `${EVOLUTION_API_URL}/instance/qrcode/${instance.instance_name}`,
          {
            method: 'GET',
            headers: {
              'apikey': EVOLUTION_API_KEY
            }
          }
        )
        
        if (qrResponse.ok) {
          qrCodeData = await qrResponse.json()
          console.log('✅ QR Code obtido separadamente:', qrCodeData)
          console.log('🔍 Debug QR Code - Estrutura completa:', JSON.stringify(qrCodeData, null, 2))
          console.log('🔍 Debug QR Code - Chaves:', Object.keys(qrCodeData))
          console.log('🔍 Debug QR Code - Tipo:', typeof qrCodeData)
          
          // Verificar campos do QR Code
          if (qrCodeData.qrcode) {
            console.log('🔍 Debug QR Code - qrcode field:', qrCodeData.qrcode)
            console.log('🔍 Debug QR Code - qrcode.base64:', qrCodeData.qrcode?.base64)
          }
          if (qrCodeData.qr) {
            console.log('🔍 Debug QR Code - qr field:', qrCodeData.qr)
          }
          if (qrCodeData.qrCode) {
            console.log('🔍 Debug QR Code - qrCode field:', qrCodeData.qrCode)
          }
        } else {
          console.log('⚠️ Não foi possível obter QR Code separadamente')
          console.log('🔍 Debug QR Code - Status:', qrResponse.status)
          console.log('🔍 Debug QR Code - Status Text:', qrResponse.statusText)
          try {
            const errorData = await qrResponse.json()
            console.log('🔍 Debug QR Code - Erro:', errorData)
          } catch (e) {
            console.log('🔍 Debug QR Code - Sem corpo de erro')
          }
        }
      } catch (qrError) {
        console.log('⚠️ Erro ao buscar QR Code separadamente:', qrError)
      }
    }

    // 6. Atualizar instância no banco de dados com novo QR Code
    const updateData = {
      qr_code: connectData.base64 || connectData.qrcode?.base64 || qrCodeData?.qrcode?.base64 || null,
      status: 'connecting',
      updated_at: new Date().toISOString()
    }
    
    console.log('🔍 Debug - Dados para atualização:', updateData)

    const { data: updatedInstance, error: updateError } = await supabase
      .from('instances')
      .update(updateData)
      .eq('id', instance.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Erro ao atualizar instância no banco:', updateError)
      return NextResponse.json(
        { error: 'Falha ao atualizar instância no banco' },
        { status: 500 }
      )
    }

    console.log('✅ Banco de dados: Instância atualizada:', updatedInstance)
    
    return NextResponse.json({
      success: true,
      instance: updatedInstance
    })

  } catch (error) {
    console.error('❌ Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticar usuário
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Não precisamos setar cookies aqui
          }
        }
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🔧 API Route GET: Tentativa de autenticação:', { user: user?.id, error: authError })
    
    if (authError || !user) {
      console.error('❌ API Route GET: Falha na autenticação:', authError)
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.log('✅ API Route GET: Usuário autenticado:', user.id)

    // 2. Buscar instância do usuário
    const { data: instance, error } = await supabase
      .from('instances')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Erro ao buscar instância:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar instância' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      instance: instance || null
    })

  } catch (error) {
    console.error('❌ Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
