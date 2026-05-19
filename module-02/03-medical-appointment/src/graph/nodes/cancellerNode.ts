import { type AppointmentService } from "../../services/appointmentService.ts";
import type { GraphState } from "../graph.ts";
import { z } from "zod/v3";

const CancelRequiredFieldsSchema = z.object({
  professionalId: z.number({
    required_error: "Professional ID is required for cancellation",
  }),
  datetime: z.string({
    required_error: "Datetime is required for cancellation",
  }),
  patientName: z.string({
    required_error: "Patient name is required for cancellation",
  }),
});

export function createCancellerNode(appointmentService: AppointmentService) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    console.log(`❌ Cancelling appointment...`);

    try {
      const validation = CancelRequiredFieldsSchema.safeParse(state);

      if (!validation.success) {
        const errorMessages = validation.error.errors
          .map((e) => e.message)
          .join("; ");
        console.log(
          `❌ Validation failed due to missing fields: ${errorMessages}`,
        );
        return {
          actionSuccess: false,
          actionError: errorMessages,
        };
      }

      appointmentService.cancelAppointment(
        validation.data.professionalId,
        validation.data.patientName,
        new Date(validation.data.datetime),
      );

      console.log(`✅ Appointment cancelled successfully`);

      return {
        actionSuccess: true,
      };
    } catch (error) {
      console.log(
        `❌ Cancellation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return {
        actionSuccess: false,
        actionError:
          error instanceof Error ? error.message : "Cancellation failed",
      };
    }
  };
}
