import { z } from "zod";

export const activitySchedulingModes = [
  "NONE",
  "OPTIONAL",
  "REQUIRED",
] as const;

export const schedulingRequirements = [
  "NONE",
  "OPTIONAL",
  "REQUIRED",
] as const;

export const activitySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "O nome deve possuir pelo menos 2 caracteres.")
      .max(120, "O nome deve possuir no máximo 120 caracteres."),

    description: z
      .string()
      .trim()
      .max(500, "A descrição deve possuir no máximo 500 caracteres.")
      .optional()
      .nullable(),

    defaultDurationMinutes: z
      .number()
      .int("A duração deve ser informada em minutos.")
      .positive("A duração deve ser maior que zero.")
      .max(1440, "A duração não pode ultrapassar 24 horas."),

    defaultPrice: z
      .number()
      .nonnegative("O preço não pode ser negativo.")
      .max(9999999999.99, "O preço informado é muito alto.")
      .optional()
      .nullable(),

    schedulingMode: z.enum(activitySchedulingModes),
    professionalRequirement: z.enum(schedulingRequirements),
    resourceRequirement: z.enum(schedulingRequirements),
    specialtyId: z.string().uuid().optional().nullable(),
  })
  .superRefine((value, context) => {
    if (
      value.schedulingMode === "NONE" &&
      (value.professionalRequirement !== "NONE" ||
        value.resourceRequirement !== "NONE")
    ) {
      context.addIssue({
        code: "custom",
        path: ["schedulingMode"],
        message:
          "Serviços sem agenda não podem exigir profissional ou recurso para agendamento.",
      });
    }
  });

export type ActivityFormData = z.infer<typeof activitySchema>;
