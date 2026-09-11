"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  createActivity,
} from "./create-activity";

import {
  updateActivity,
} from "./update-activity";

import {
  setActivityStatus,
} from "./set-activity-status";

import {
  SupabaseActivityRepository,
} from "../infrastructure/supabase-activity-repository";

import {
  getCurrentOrganizationId,
} from "@/shared/auth/get-current-organization-id";

/*
 * IMPORTANT:
 *
 * Replace this import ONLY if your existing Supabase
 * server helper has a different path/name.
 */
import {
  createClient,
} from "@/shared/database/supabase/server";

export type ActivityActionResult = {
  success: boolean;
  error?: string;
};

type SaveActivityRequest = {
  id?: string;
  name: string;
  description?: string | null;
  defaultDurationMinutes: number;
  defaultPrice?: number | null;
};

export async function saveActivityAction(
  request: SaveActivityRequest
): Promise<ActivityActionResult> {
  try {
    const supabase =
      await createClient();

    const organizationId =
      await getCurrentOrganizationId(
        supabase
      );

    const repository =
      new SupabaseActivityRepository(
        supabase
      );

    if (request.id) {
      await updateActivity(
        repository,
        {
          id:
            request.id,

          organizationId,

          name:
            request.name,

          description:
            request.description,

          defaultDurationMinutes:
            request.defaultDurationMinutes,

          defaultPrice:
            request.defaultPrice,
        }
      );
    } else {
      await createActivity(
        repository,
        {
          organizationId,

          name:
            request.name,

          description:
            request.description,

          defaultDurationMinutes:
            request.defaultDurationMinutes,

          defaultPrice:
            request.defaultPrice,
        }
      );
    }

    revalidatePath(
      "/services"
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "[ACTIVITIES] Failed to save activity",
      error
    );

    return {
      success: false,
      error:
        getErrorMessage(error),
    };
  }
}

export async function toggleActivityAction(
  activityId: string,
  active: boolean
): Promise<ActivityActionResult> {
  try {
    const supabase =
      await createClient();

    const organizationId =
      await getCurrentOrganizationId(
        supabase
      );

    const repository =
      new SupabaseActivityRepository(
        supabase
      );

    await setActivityStatus(
      repository,
      {
        id:
          activityId,

        organizationId,

        active,
      }
    );

    revalidatePath(
      "/services"
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "[ACTIVITIES] Failed to change activity status",
      error
    );

    return {
      success: false,
      error:
        getErrorMessage(error),
    };
  }
}

function getErrorMessage(
  error: unknown
): string {
  if (
    error instanceof Error
  ) {
    if (
      error.message.includes(
        "uq_activities_organization_name"
      ) ||
      error.message.includes(
        "duplicate key"
      )
    ) {
      return "Já existe um serviço com este nome.";
    }

    return error.message;
  }

  return "Não foi possível concluir a operação.";
}