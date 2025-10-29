import Stripe from "stripe";
import { prisma } from "../../shared/prisma";
import { PaymentStatus, Prisma } from "@prisma/client";

export interface StripeWebhookResult {
  success: boolean;
  message: string;
  appointmentId?: string;
  paymentId?: string;
  paymentStatus?: string;
  error?: any;
}

const handleStripeWebhookEvent = async (
  event: Stripe.Event
): Promise<StripeWebhookResult> => {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const appointmentId = session.metadata?.appointmentId;
        const paymentId = session.metadata?.paymentId;
        const paymentIntentId = session.payment_intent as string;
        const email = session.customer_email;

        // Update appointment if exists
        if (appointmentId) {
          await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
              paymentStatus:
                session.payment_status === "paid"
                  ? PaymentStatus.PAID
                  : PaymentStatus.UNPAID,
            },
          });
        }

        // Update payment if exists
        if (paymentId) {
          await prisma.payment.update({
            where: { id: paymentId },
            data: {
              status:
                session.payment_status === "paid"
                  ? PaymentStatus.PAID
                  : PaymentStatus.UNPAID
            },
          });
        }

        return {
          success: true,
          message: "Checkout session processed successfully",
          appointmentId,
          paymentId,
          paymentStatus: session.payment_status,
        };
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
        return {
          success: false,
          message: `Unhandled event type: ${event.type}`,
        };
    }
};

export const PaymentService = {
  handleStripeWebhookEvent,
};
