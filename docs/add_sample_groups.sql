-- Script para adicionar grupos de exemplo para teste da funcionalidade admin
-- EXECUTE APENAS SE NÃO HOUVER DADOS NA TABELA group_selections

-- Primeiro, verificar se há dados existentes
DO $$
DECLARE
    group_count INTEGER;
    admin_user_id UUID;
    regular_user_id UUID;
BEGIN
    -- Contar grupos existentes
    SELECT COUNT(*) INTO group_count FROM group_selections;
    
    -- Se não há grupos, adicionar dados de exemplo
    IF group_count = 0 THEN
        -- Buscar ID do usuário admin
        SELECT id INTO admin_user_id 
        FROM users 
        WHERE role = 'admin' 
        LIMIT 1;
        
        -- Buscar ID de um usuário regular (ou usar o admin se não houver)
        SELECT id INTO regular_user_id 
        FROM users 
        WHERE role = 'user' 
        LIMIT 1;
        
        -- Se não encontrou usuário regular, usar o admin
        IF regular_user_id IS NULL THEN
            regular_user_id := admin_user_id;
        END IF;
        
        -- Inserir grupos de exemplo apenas se tivermos pelo menos um usuário
        IF admin_user_id IS NOT NULL THEN
            INSERT INTO group_selections (id, name, description, user_id, active, created_at, updated_at)
            VALUES 
                (gen_random_uuid(), 'Família Silva', 'Grupo da família Silva para conversas do dia a dia', admin_user_id, true, NOW(), NOW()),
                (gen_random_uuid(), 'Trabalho - Equipe Dev', 'Grupo da equipe de desenvolvimento', admin_user_id, true, NOW(), NOW()),
                (gen_random_uuid(), 'Amigos da Faculdade', 'Grupo dos amigos da época da faculdade', regular_user_id, false, NOW() - INTERVAL '5 days', NOW()),
                (gen_random_uuid(), 'Vizinhos do Condomínio', 'Grupo dos moradores para avisos e organização', regular_user_id, true, NOW() - INTERVAL '3 days', NOW()),
                (gen_random_uuid(), 'Clube do Livro', 'Grupo para discussões sobre livros e leituras', admin_user_id, false, NOW() - INTERVAL '7 days', NOW());
            
            RAISE NOTICE 'Grupos de exemplo adicionados com sucesso!';
        ELSE
            RAISE NOTICE 'Nenhum usuário encontrado. Não foi possível adicionar grupos de exemplo.';
        END IF;
    ELSE
        RAISE NOTICE 'Já existem % grupos na tabela. Nenhum dado de exemplo foi adicionado.', group_count;
    END IF;
END $$;

-- Verificar os dados inseridos
SELECT 
    gs.id,
    gs.name,
    gs.description,
    u.name as user_name,
    u.email as user_email,
    u.role as user_role,
    gs.active,
    gs.created_at
FROM group_selections gs
JOIN users u ON gs.user_id = u.id
ORDER BY gs.created_at DESC;
