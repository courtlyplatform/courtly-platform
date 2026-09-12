import { NextResponse } from "next/server";
import { createClient } from "@/shared/database/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = safeNext(url.searchParams.get("next"));

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Convite inválido ou incompleto.")}`, url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as any,
  });

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("O convite expirou ou já foi utilizado.")}`, url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/reset-password";
  return value;
}
