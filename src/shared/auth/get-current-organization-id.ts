import type {
  SupabaseClient,
} from "@supabase/supabase-js";

export async function getCurrentOrganizationId(
  supabase: SupabaseClient
): Promise<string> {
  const {
    data: authData,
    error: authError,
  } =
    await supabase.auth.getUser();

  if (
    authError ||
    !authData.user
  ) {
    throw new Error(
      "User is not authenticated."
    );
  }

  const {
    data: membership,
    error: membershipError,
  } =
    await supabase
      .from("memberships")
      .select("organization_id")
      .eq(
        "user_id",
        authData.user.id
      )
      .limit(1)
      .maybeSingle();

  if (
    membershipError ||
    !membership
  ) {
    throw new Error(
      "No organization membership found."
    );
  }

  return membership.organization_id;
}