select
    enumlabel
from pg_enum
where enumtypid =
    'public.subscription_status'::regtype
order by enumsortorder;