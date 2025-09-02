import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar assinaturas do usuário com pagamentos e informações do grupo
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        payments (
          id,
          value,
          status,
          due_date,
          payment_date,
          invoice_url,
          transaction_receipt_url,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (subscriptionsError) {
      console.error('Erro ao buscar assinaturas:', subscriptionsError)
      return NextResponse.json({ error: 'Erro ao buscar assinaturas' }, { status: 500 })
    }

    // Buscar nomes dos grupos das group_selections
    const subscriptionIds = subscriptions?.map(s => s.id) || []
    const { data: groupSelections, error: groupSelectionsError } = await supabase
      .from('group_selections')
      .select('subscription_id, group_name')
      .in('subscription_id', subscriptionIds)

    if (groupSelectionsError) {
      console.error('Erro ao buscar seleções de grupos:', groupSelectionsError)
      return NextResponse.json({ error: 'Erro ao buscar grupos' }, { status: 500 })
    }

    // Criar mapa de subscription_id -> group_name
    const groupNameMap = new Map()
    groupSelections?.forEach(gs => {
      groupNameMap.set(gs.subscription_id, gs.group_name)
    })

    // Transformar dados para incluir nome do grupo
    const subscriptionsWithGroupName = subscriptions?.map(subscription => ({
      ...subscription,
      group_name: groupNameMap.get(subscription.id) || null
    })) || []

    return NextResponse.json({ 
      subscriptions: subscriptionsWithGroupName 
    }, { status: 200 })

  } catch (error) {
    console.error('Erro na API de assinaturas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}