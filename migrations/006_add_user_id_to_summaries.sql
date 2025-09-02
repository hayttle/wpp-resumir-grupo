-- Adicionar coluna user_id na tabela summaries
ALTER TABLE public.summaries 
ADD COLUMN user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX idx_summaries_user_id ON public.summaries(user_id);

-- Criar índice composto para consultas por usuário e grupo
CREATE INDEX idx_summaries_user_group ON public.summaries(user_id, group_selection_id);
