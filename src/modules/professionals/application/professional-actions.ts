'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/shared/database/supabase/server';
import { createAdminClient } from '@/shared/database/supabase/admin';
import { can, getCurrentAccessContext } from '@/shared/auth/permissions';
import type { ProfessionalSpecialtyArea } from '../domain/professional';

export type ProfessionalActionResult = { success: true; data?: any } | { success: false; error: string };
const clean = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : null;
const specialtyAreas: ProfessionalSpecialtyArea[] = ['HEALTHCARE','DENTISTRY','FITNESS','SPORTS','THERAPY','BEAUTY','WELLNESS','EDUCATION','OTHER'];
const validHexColor = (value: string) => /^#[0-9A-F]{6}$/i.test(value);

function hasAvailabilityOverlap(rules: any[]) {
  const enabled = rules
    .filter((r) => r.enabled && r.startTime && r.endTime)
    .map((r) => ({ weekday: Number(r.weekday), startTime: String(r.startTime), endTime: String(r.endTime) }))
    .sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime));
  for (let i = 0; i < enabled.length; i += 1) {
    if (enabled[i].endTime <= enabled[i].startTime) return true;
    const previous = enabled[i - 1];
    if (previous && previous.weekday === enabled[i].weekday && enabled[i].startTime < previous.endTime) return true;
  }
  return false;
}

export async function saveProfessionalAction(input: any): Promise<ProfessionalActionResult> {
  try {
    const supabase = await createClient();
    const context = await getCurrentAccessContext(supabase);
    const db = supabase as any;
    const editing = Boolean(input.id);
    if (!can(context, editing ? 'PROFESSIONALS_EDIT' : 'PROFESSIONALS_CREATE')) return { success: false, error: 'forbidden' };
    const firstName = clean(input.firstName);
    const lastName = clean(input.lastName);
    if (!firstName || !lastName) return { success: false, error: 'nameRequired' };
    if (hasAvailabilityOverlap(input.availabilityRules ?? [])) return { success: false, error: 'invalidAvailability' };

    const payload = {
      organization_id: context.organizationId,
      name: `${firstName} ${lastName}`.trim(),
      first_name: firstName,
      last_name: lastName,
      preferred_name: clean(input.preferredName),
      job_title: clean(input.jobTitle),
      email: clean(input.email),
      phone: clean(input.phone),
      birth_date: clean(input.birthDate),
      country_code: clean(input.countryCode)?.toUpperCase() ?? null,
      document_type: clean(input.documentType),
      document_number: clean(input.documentNumber),
      notes: clean(input.notes),
    };

    let id = input.id as string | undefined;
    if (id) {
      const { error } = await db.from('professionals').update(payload).eq('id', id).eq('organization_id', context.organizationId);
      if (error) throw error;
    } else {
      const { data, error } = await db.from('professionals').insert({ ...payload, active: true }).select('id').single();
      if (error) throw error;
      id = data.id;
    }

    await db.from('professional_specialty_assignments').delete().eq('professional_id', id).eq('organization_id', context.organizationId);
    if (Array.isArray(input.specialtyIds) && input.specialtyIds.length) {
      const { error } = await db.from('professional_specialty_assignments').insert(input.specialtyIds.map((specialtyId: string) => ({ organization_id: context.organizationId, professional_id: id, specialty_id: specialtyId })));
      if (error) throw error;
    }

    await db.from('professional_activities').delete().eq('professional_id', id).eq('organization_id', context.organizationId);
    if (Array.isArray(input.activityIds) && input.activityIds.length) {
      const { error } = await db.from('professional_activities').insert(input.activityIds.map((activityId: string) => ({ organization_id: context.organizationId, professional_id: id, activity_id: activityId })));
      if (error) throw error;
    }

    await db.from('professional_registrations').delete().eq('professional_id', id).eq('organization_id', context.organizationId);
    const regs = (input.registrations ?? []).filter((r: any) => clean(r.authority) && clean(r.registrationNumber));
    if (regs.length) {
      const { error } = await db.from('professional_registrations').insert(regs.map((r: any) => ({ organization_id: context.organizationId, professional_id: id, authority: clean(r.authority), registration_number: clean(r.registrationNumber), region: clean(r.region) })));
      if (error) throw error;
    }

    await db.from('professional_availability_rules').delete().eq('professional_id', id).eq('organization_id', context.organizationId);
    const availability = (input.availabilityRules ?? []).filter((r: any) => r.enabled && r.startTime && r.endTime && r.endTime > r.startTime);
    if (availability.length) {
      const { error } = await db.from('professional_availability_rules').insert(availability.map((r: any) => ({ organization_id: context.organizationId, professional_id: id, weekday: Number(r.weekday), start_time: r.startTime, end_time: r.endTime, active: true })));
      if (error) throw error;
    }

    revalidatePath('/professionals');
    revalidatePath('/scheduling');
    return { success: true, data: { id } };
  } catch (e) {
    console.error('[PROFESSIONALS] save failed', e);
    return { success: false, error: 'saveFailed' };
  }
}

export async function saveSpecialtyAction(input: { id?: string; name: string; area: ProfessionalSpecialtyArea; color: string }): Promise<ProfessionalActionResult> {
  try {
    const supabase = await createClient();
    const context = await getCurrentAccessContext(supabase);
    if (!can(context, 'PROFESSIONALS_EDIT')) return { success: false, error: 'forbidden' };
    const name = clean(input.name);
    if (!name || !specialtyAreas.includes(input.area) || !validHexColor(input.color)) return { success: false, error: 'invalidData' };
    const db = supabase as any;
    const payload = { name, area: input.area, color: input.color.toUpperCase() };
    const query = input.id
      ? db.from('professional_specialties').update(payload).eq('id', input.id).eq('organization_id', context.organizationId)
      : db.from('professional_specialties').insert({ organization_id: context.organizationId, ...payload, active: true });
    const { error } = await query;
    if (error?.code === '23505') return { success: false, error: 'duplicateSpecialty' };
    if (error) throw error;
    revalidatePath('/professionals');
    revalidatePath('/scheduling');
    return { success: true };
  } catch (e) {
    console.error('[PROFESSIONALS] specialty save failed', e);
    return { success: false, error: 'saveFailed' };
  }
}

export async function setSpecialtyStatusAction(specialtyId: string, active: boolean): Promise<ProfessionalActionResult> {
  try {
    const supabase = await createClient();
    const context = await getCurrentAccessContext(supabase);
    if (!can(context, 'PROFESSIONALS_EDIT')) return { success: false, error: 'forbidden' };
    const { error } = await (supabase as any).from('professional_specialties').update({ active }).eq('id', specialtyId).eq('organization_id', context.organizationId);
    if (error) throw error;
    revalidatePath('/professionals');
    revalidatePath('/scheduling');
    return { success: true };
  } catch (e) {
    console.error('[PROFESSIONALS] specialty status failed', e);
    return { success: false, error: 'statusFailed' };
  }
}

export async function setProfessionalStatusAction(professionalId: string, active: boolean): Promise<ProfessionalActionResult> {
  try {
    const supabase = await createClient(); const context = await getCurrentAccessContext(supabase);
    if (!can(context, 'PROFESSIONALS_DISABLE')) return { success: false, error: 'forbidden' };
    const { data, error } = await (supabase as any).rpc('set_professional_active_status', { p_professional_id: professionalId, p_active: active });
    if (error) throw error;
    revalidatePath('/professionals'); revalidatePath('/scheduling');
    return { success: true, data: { futureAppointments: Number(data?.[0]?.future_appointments ?? 0) } };
  } catch (e) { console.error(e); return { success: false, error: 'statusFailed' }; }
}

export async function reassignFutureAppointmentsAction(fromProfessionalId: string, toProfessionalId: string): Promise<ProfessionalActionResult> {
  try {
    const supabase = await createClient(); const context = await getCurrentAccessContext(supabase);
    if (!can(context, 'SCHEDULING_RESCHEDULE')) return { success: false, error: 'forbidden' };
    const { data, error } = await (supabase as any).rpc('reassign_professional_future_appointments', { p_from_professional_id: fromProfessionalId, p_to_professional_id: toProfessionalId });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    revalidatePath('/professionals'); revalidatePath('/scheduling');
    return { success: true, data: { moved: Number(row?.moved ?? 0), remaining: Number(row?.remaining ?? 0) } };
  } catch (e) { console.error(e); return { success: false, error: 'reassignFailed' }; }
}

export async function saveProfessionalAccessAction(input: { professionalId: string; role: 'ADMIN' | 'PROFESSIONAL'; permissionOverrides: Record<string, boolean> }): Promise<ProfessionalActionResult> {
  try {
    const supabase = await createClient(); const context = await getCurrentAccessContext(supabase);
    if (!can(context, 'PROFESSIONALS_MANAGE_ACCESS')) return { success: false, error: 'forbidden' };
    const db = supabase as any;
    const { data: professional, error: pError } = await db.from('professionals').select('user_id').eq('id', input.professionalId).eq('organization_id', context.organizationId).single();
    if (pError || !professional?.user_id) return { success: false, error: 'noAccessAccount' };
    const admin = createAdminClient() as any;
    const { data: membership, error: mError } = await admin.from('memberships').update({ role: input.role }).eq('organization_id', context.organizationId).eq('user_id', professional.user_id).select('id').single();
    if (mError) throw mError;
    await admin.from('membership_permission_overrides').delete().eq('membership_id', membership.id);
    const rows = Object.entries(input.permissionOverrides).map(([permission_code, allowed]) => ({ membership_id: membership.id, permission_code, allowed }));
    if (rows.length) { const { error } = await admin.from('membership_permission_overrides').insert(rows); if (error) throw error; }
    await db.from('audit_logs').insert({ organization_id: context.organizationId, actor_user_id: (await supabase.auth.getUser()).data.user?.id, entity_type: 'PROFESSIONAL', entity_id: input.professionalId, action: 'ACCESS_UPDATED', metadata: { role: input.role } });
    revalidatePath('/professionals');
    return { success: true };
  } catch (e) { console.error(e); return { success: false, error: 'accessFailed' }; }
}

export async function inviteProfessionalAction(professionalId: string, email: string, role: 'ADMIN' | 'PROFESSIONAL'): Promise<ProfessionalActionResult> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return { success: false, error: 'invalidEmail' };

    const supabase = await createClient();
    const context = await getCurrentAccessContext(supabase);
    if (!can(context, 'PROFESSIONALS_MANAGE_ACCESS')) return { success: false, error: 'forbidden' };

    const db = supabase as any;
    const { data: professional, error } = await db
      .from('professionals')
      .select('id,first_name,last_name,user_id')
      .eq('id', professionalId)
      .eq('organization_id', context.organizationId)
      .single();

    if (error || !professional) return { success: false, error: 'notFound' };
    if (professional.user_id) return { success: false, error: 'alreadyHasAccess' };

    const admin = createAdminClient();
    const adminDb = admin as any;
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const redirectTo = `${appUrl}/reset-password`;
    const fullName = `${professional.first_name ?? ''} ${professional.last_name ?? ''}`.trim();

    let userId: string;
    let invitationLink: string | null = null;

    // When Resend is configured, generate the Supabase invite link without asking
    // Supabase to deliver the message, then send a branded real email ourselves.
    // This also works with local Supabase because email delivery is external.
    if (process.env.RESEND_API_KEY && process.env.COURTLY_FROM_EMAIL) {
      const generated = await admin.auth.admin.generateLink({
        type: 'invite',
        email: normalizedEmail,
        options: {
          redirectTo,
          data: { full_name: fullName },
        },
      });
      if (generated.error || !generated.data.user || !generated.data.properties?.action_link) {
        throw generated.error ?? new Error('Could not generate invitation link');
      }

      userId = generated.data.user.id;
      const tokenHash = generated.data.properties.hashed_token;
      if (!tokenHash) throw new Error('Supabase did not return an invitation token');
      invitationLink = `${appUrl}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=invite&next=${encodeURIComponent('/reset-password')}`;

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.COURTLY_FROM_EMAIL,
          to: [normalizedEmail],
          subject: 'Seu acesso ao COURTLY',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#18251f">
              <h2 style="margin-bottom:8px">Você recebeu acesso ao COURTLY</h2>
              <p>Olá${fullName ? `, ${escapeHtml(fullName)}` : ''}.</p>
              <p>Seu acesso foi criado com o nível <strong>${role}</strong>. Use o botão abaixo para definir sua senha e entrar no portal.</p>
              <p style="margin:28px 0"><a href="${escapeHtml(invitationLink)}" style="background:#1f7a5f;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;display:inline-block;font-weight:700">Definir minha senha</a></p>
              <p style="font-size:12px;color:#66756e">Se você não esperava este convite, ignore esta mensagem.</p>
            </div>`,
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Resend delivery failed: ${response.status} ${body}`);
      }
    } else {
      // Production Supabase projects can deliver this through their configured SMTP.
      // For local Supabase, configure RESEND_API_KEY + COURTLY_FROM_EMAIL to receive
      // the invitation in a real inbox instead of the local mail catcher.
      const invited = await admin.auth.admin.inviteUserByEmail(normalizedEmail, {
        redirectTo,
        data: { full_name: fullName },
      });
      if (invited.error || !invited.data.user) throw invited.error ?? new Error('invite failed');
      userId = invited.data.user.id;
    }

    const { error: membershipError } = await adminDb.from('memberships').insert({
      organization_id: context.organizationId,
      user_id: userId,
      role,
    });
    if (membershipError && membershipError.code !== '23505') throw membershipError;

    const { error: updateError } = await adminDb.from('professionals').update({
      user_id: userId,
      email: normalizedEmail,
      access_status: 'INVITED',
    }).eq('id', professionalId).eq('organization_id', context.organizationId);
    if (updateError) throw updateError;

    revalidatePath('/professionals');
    return { success: true };
  } catch (e) {
    console.error('[PROFESSIONALS] Invitation failed', e);
    return { success: false, error: e instanceof Error ? e.message : 'inviteFailed' };
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}



export async function uploadProfessionalAvatarAction(
  professionalId: string,
  formData: FormData,
): Promise<ProfessionalActionResult> {
  try {
    const supabase = await createClient();
    const context = await getCurrentAccessContext(supabase);

    if (!can(context, 'PROFESSIONALS_EDIT')) {
      return { success: false, error: 'forbidden' };
    }

    const file = formData.get('avatar');

    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: 'avatarRequired' };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'avatarTooLarge' };
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return { success: false, error: 'invalidAvatarType' };
    }

    const extension =
      file.type === 'image/png'
        ? 'png'
        : file.type === 'image/webp'
          ? 'webp'
          : 'jpg';

    const db = supabase as any;

    const { data: currentProfessional, error: currentError } = await db
      .from('professionals')
      .select('avatar_path')
      .eq('id', professionalId)
      .eq('organization_id', context.organizationId)
      .single();

    if (currentError) {
      throw currentError;
    }

    const path = `professionals/${context.organizationId}/${professionalId}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { error: updateError } = await db
      .from('professionals')
      .update({ avatar_path: path })
      .eq('id', professionalId)
      .eq('organization_id', context.organizationId);

    if (updateError) {
      await supabase.storage.from('avatars').remove([path]);
      throw updateError;
    }

    if (currentProfessional?.avatar_path) {
      const { error: removeOldError } = await supabase.storage
        .from('avatars')
        .remove([currentProfessional.avatar_path]);

      if (removeOldError) {
        console.warn('[PROFESSIONALS] old avatar cleanup failed', removeOldError);
      }
    }

    revalidatePath('/professionals');
    revalidatePath(`/professionals/${professionalId}/edit`);

    return { success: true };
  } catch (e) {
    console.error('[PROFESSIONALS] avatar upload failed', e);
    return { success: false, error: 'avatarUploadFailed' };
  }
}

export async function removeProfessionalAvatarAction(
  professionalId: string,
): Promise<ProfessionalActionResult> {
  try {
    const supabase = await createClient();
    const context = await getCurrentAccessContext(supabase);

    if (!can(context, 'PROFESSIONALS_EDIT')) {
      return { success: false, error: 'forbidden' };
    }

    const db = supabase as any;

    const { data: professional, error: professionalError } = await db
      .from('professionals')
      .select('avatar_path')
      .eq('id', professionalId)
      .eq('organization_id', context.organizationId)
      .single();

    if (professionalError) {
      throw professionalError;
    }

    if (professional?.avatar_path) {
      const { error: storageError } = await supabase.storage
        .from('avatars')
        .remove([professional.avatar_path]);

      if (storageError) {
        throw storageError;
      }
    }

    const { error: updateError } = await db
      .from('professionals')
      .update({ avatar_path: null })
      .eq('id', professionalId)
      .eq('organization_id', context.organizationId);

    if (updateError) {
      throw updateError;
    }

    revalidatePath('/professionals');
    revalidatePath(`/professionals/${professionalId}/edit`);

    return { success: true };
  } catch (e) {
    console.error('[PROFESSIONALS] avatar removal failed', e);
    return { success: false, error: 'avatarRemoveFailed' };
  }
}

export async function saveProfessionalScheduleExceptionAction(input: {
  id?: string;
  professionalId: string;
  exceptionType: 'ABSENCE' | 'PRESENCE';
  startsAt: string;
  endsAt: string;
  reason: 'PERSONAL' | 'HEALTH' | 'VACATION' | 'TRAINING' | 'EVENT' | 'EXTRA_SHIFT' | 'COVERAGE' | 'OTHER';
  reasonDetails?: string | null;
}): Promise<ProfessionalActionResult> {
  try {
    const supabase = await createClient();
    const context = await getCurrentAccessContext(supabase);
    if (!can(context, 'PROFESSIONALS_EDIT')) return { success: false, error: 'forbidden' };

    if (!input.professionalId || !input.startsAt || !input.endsAt || new Date(input.endsAt) <= new Date(input.startsAt)) {
      return { success: false, error: 'invalidData' };
    }
    if (input.reason === 'OTHER' && !clean(input.reasonDetails)) {
      return { success: false, error: 'reasonDetailsRequired' };
    }

    const payload = {
      organization_id: context.organizationId,
      professional_id: input.professionalId,
      exception_type: input.exceptionType,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      reason: input.reason,
      reason_details: clean(input.reasonDetails),
      active: true,
    };
    const db = supabase as any;
    const query = input.id
      ? db.from('professional_schedule_exceptions').update(payload).eq('id', input.id).eq('organization_id', context.organizationId)
      : db.from('professional_schedule_exceptions').insert(payload);
    const { error } = await query;
    if (error) throw error;

    revalidatePath('/professionals');
    revalidatePath('/scheduling');
    return { success: true };
  } catch (e) {
    console.error('[PROFESSIONALS] schedule exception save failed', e);
    return { success: false, error: 'saveFailed' };
  }
}

export async function setProfessionalScheduleExceptionActiveAction(
  exceptionId: string,
  active: boolean,
): Promise<ProfessionalActionResult> {
  try {
    const supabase = await createClient();
    const context = await getCurrentAccessContext(supabase);
    if (!can(context, 'PROFESSIONALS_EDIT')) return { success: false, error: 'forbidden' };
    const { error } = await (supabase as any).from('professional_schedule_exceptions')
      .update({ active }).eq('id', exceptionId).eq('organization_id', context.organizationId);
    if (error) throw error;
    revalidatePath('/professionals');
    revalidatePath('/scheduling');
    return { success: true };
  } catch (e) {
    console.error('[PROFESSIONALS] schedule exception status failed', e);
    return { success: false, error: 'statusFailed' };
  }
}
