-- Script para inserir planos de exemplo na tabela plans
-- Execute este script no Supabase SQL Editor

INSERT INTO public.plans (name, description, price, max_groups, features) VALUES
(
  'Plano Básico',
  'Acesso a 1 grupo do WhatsApp com funcionalidades essenciais',
  29.90,
  1,
  ARRAY[
    'Gerenciamento de 1 grupo',
    'Resumos automáticos diários',
    'Histórico de 30 dias',
    'Suporte por email'
  ]
),
(
  'Plano Profissional',
  'Acesso a 3 grupos do WhatsApp com funcionalidades avançadas',
  79.90,
  3,
  ARRAY[
    'Gerenciamento de 3 grupos',
    'Resumos automáticos diários',
    'Histórico de 90 dias',
    'Agendamento de mensagens',
    'Relatórios detalhados',
    'Suporte prioritário'
  ]
),
(
  'Plano Empresarial',
  'Acesso a 10 grupos do WhatsApp com funcionalidades completas',
  199.90,
  10,
  ARRAY[
    'Gerenciamento de 10 grupos',
    'Resumos automáticos diários',
    'Histórico ilimitado',
    'Agendamento de mensagens',
    'Relatórios avançados',
    'API de integração',
    'Suporte 24/7',
    'Treinamento personalizado'
  ]
);

-- Verificar se os planos foram inseridos
SELECT * FROM public.plans ORDER BY price;
