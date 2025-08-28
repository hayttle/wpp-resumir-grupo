import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Configuração server-side (segura)
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL

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
      status: evolutionData.instance?.status || 'close',
      qr_code: evolutionData.qrcode?.code || null,
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
