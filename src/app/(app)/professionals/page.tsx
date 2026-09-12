import { redirect } from 'next/navigation';
import { createClient } from '@/shared/database/supabase/server';
import { getCurrentAccessContext, can } from '@/shared/auth/permissions';
import { SupabaseProfessionalRepository } from '@/modules/professionals/infrastructure/supabase-professional-repository';
import { ProfessionalsClient } from '@/modules/professionals/ui/ProfessionalsClient';

export default async function ProfessionalsPage() {
  const supabase = await createClient();
  const context = await getCurrentAccessContext(supabase);
  if (!can(context,'PROFESSIONALS_VIEW')) redirect('/dashboard');
  const repository = new SupabaseProfessionalRepository(supabase);
  const data = await repository.getPageData(context.organizationId);
  return <ProfessionalsClient initialData={data} />;
}
