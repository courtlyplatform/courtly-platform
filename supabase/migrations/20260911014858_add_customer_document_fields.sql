alter table public.customers
add column document_type varchar(30);

alter table public.customers
add column document_number varchar(50);

create unique index customers_organization_document_unique
on public.customers (
    organization_id,
    document_type,
    document_number
)
where
    document_type is not null
    and document_number is not null;