import { supabase } from './supabase'

// Função para inicializar o banco com dados padrão
export async function initializeDatabase() {
  try {
    console.log('🔄 Inicializando banco de dados...')

    // Verificar se já existem planos
    const { data: existingPlans } = await supabase
      .from('plans')
      .select('id')
      .limit(1)

    if (existingPlans && existingPlans.length > 0) {
      console.log('✅ Banco já inicializado')
      return
    }

    // Criar planos padrão
    const defaultPlans = [
      {
        name: 'Básico',
        description: 'Plano básico para 1 grupo',
        price: 29.90,
        max_groups: 1,
        features: [
          '1 grupo por assinatura',
          'Resumos diários',
          'Suporte por email'
        ]
      },
      {
        name: 'Profissional',
        description: 'Plano profissional para até 5 grupos',
        price: 59.90,
        max_groups: 5,
        features: [
          'Até 5 grupos',
          'Resumos personalizados',
          'Suporte prioritário',
          'Relatórios avançados'
        ]
      },
      {
        name: 'Enterprise',
        description: 'Plano enterprise para grupos ilimitados',
        price: 199.90,
        max_groups: -1, // -1 significa ilimitado
        features: [
          'Grupos ilimitados',
          'API personalizada',
          'Suporte 24/7',
          'SLA garantido'
        ]
      }
    ]

    // Inserir planos padrão
    for (const plan of defaultPlans) {
      const { error } = await supabase
        .from('plans')
        .insert([plan])

      if (error) {
        console.error('❌ Erro ao criar plano:', plan.name, error)
      } else {
        console.log('✅ Plano criado:', plan.name)
      }
    }

    console.log('✅ Banco de dados inicializado com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error)
  }
}

// Função para verificar status da conexão
export async function checkDatabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('id')
      .limit(1)

    if (error) {
      console.error('❌ Erro na conexão com banco:', error)
      return false
    }

    console.log('✅ Conexão com banco estabelecida')
    return true
  } catch (error) {
    console.error('❌ Erro ao verificar conexão:', error)
    return false
  }
}

// Função para limpar dados de teste
export async function clearTestData() {
  try {
    console.log('🧹 Limpando dados de teste...')

    // Limpar mensagens e resumos (dados temporários)
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    const { error: summariesError } = await supabase
      .from('summaries')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (messagesError) console.error('❌ Erro ao limpar mensagens:', messagesError)
    if (summariesError) console.error('❌ Erro ao limpar resumos:', summariesError)

    console.log('✅ Dados de teste limpos')
  } catch (error) {
    console.error('❌ Erro ao limpar dados de teste:', error)
  }
}
