select
    id,
    organization_id,
    name,
    resource_type_id,
    active
from public.resources
order by name;