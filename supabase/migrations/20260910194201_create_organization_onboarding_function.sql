create or replace function public.create_organization_onboarding(
    p_organization_name text,
    p_professional_name text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid;
    v_organization_id uuid;
    v_slug text;
begin
    -- Obtém o usuário autenticado
    v_user_id := auth.uid();

    -- Impede execução sem autenticação
    if v_user_id is null then
        raise exception 'User is not authenticated';
    end if;

    -- Impede que o mesmo usuário faça onboarding novamente
    if exists (
        select 1
        from public.memberships m
        where m.user_id = v_user_id
    ) then
        raise exception 'User already belongs to an organization';
    end if;

    -- Valida o nome da organização
    if trim(p_organization_name) = '' then
        raise exception 'Organization name is required';
    end if;

    -- Valida o nome do profissional
    if trim(p_professional_name) = '' then
        raise exception 'Professional name is required';
    end if;

    -- Gera um slug único para a organização
    v_slug :=
        lower(
            regexp_replace(
                trim(p_organization_name),
                '[^a-zA-Z0-9]+',
                '-',
                'g'
            )
        )
        || '-'
        || substring(v_user_id::text, 1, 8);

    -- Cria a organização
    insert into public.organizations (
        name,
        slug,
        timezone,
        status
    )
    values (
        trim(p_organization_name),
        v_slug,
        'America/Sao_Paulo',
        'ACTIVE'
    )
    returning id into v_organization_id;

    -- Torna o usuário OWNER da organização
    insert into public.memberships (
        organization_id,
        user_id,
        role
    )
    values (
        v_organization_id,
        v_user_id,
        'OWNER'
    );

    -- Cria o profissional correspondente ao usuário
    insert into public.professionals (
        organization_id,
        user_id,
        name,
        email,
        active
    )
    select
        v_organization_id,
        v_user_id,
        trim(p_professional_name),
        u.email,
        true
    from auth.users u
    where u.id = v_user_id;

    -- Retorna a organização criada
    return v_organization_id;
end;
$$;


-- =========================================================
-- Permissions
-- =========================================================

-- Ninguém recebe acesso implicitamente
revoke all on function public.create_organization_onboarding(text, text)
from public;

-- Usuários não autenticados não podem executar o onboarding
revoke all on function public.create_organization_onboarding(text, text)
from anon;

-- Somente usuários autenticados podem executar
grant execute on function public.create_organization_onboarding(text, text)
to authenticated;