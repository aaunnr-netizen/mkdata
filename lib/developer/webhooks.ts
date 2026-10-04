import { after } from "next/server";
import crypto from "crypto";
import { prisma } from "../db";
import { signWebhookPayload } from "./crypto";

export interface DeveloperWebhookEventPayload {
  id: string;
  event: string;
  created_at: string;
  data: Record<string, any>;
}

/**
 * Dispatches an event-driven webhook notification to the developer's registered endpoint.
 * Dispatched asynchronously via Next.js 16 after() with zero blocking overhead on the response.
 */
export function dispatchDeveloperWebhook(
  userId: string,
  event: string,
  data: Record<string, any>
): void {
  const runner = async () => {
    try {
      const endpoint = await prisma.developerWebhookEndpoint.findUnique({
        where: { userId },
      });

      if (!endpoint || !endpoint.isActive || !endpoint.url) {
        return;
      }

      // Check if endpoint is subscribed to this event
      if (!endpoint.events.includes(event) && !endpoint.events.includes("*")) {
        return;
      }

      const eventId = `evt_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
      const timestamp = Math.floor(Date.now() / 1000);
      const payload: DeveloperWebhookEventPayload = {
        id: eventId,
        event,
        created_at: new Date().toISOString(),
        data,
      };

      const payloadString = JSON.stringify(payload);
      const signatureHeader = signWebhookPayload(endpoint.secret, timestamp, payloadString);

      // Create delivery record in DB
      const delivery = await prisma.developerWebhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          userId,
          event,
          payload: payload as any,
          status: "PENDING",
          attempts: 1,
        },
      });

      // Dispatch HTTP POST with strict 5-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const res = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "MKData-Webhook/1.0",
            "X-MK-Signature": signatureHeader,
            "X-MK-Event": event,
          },
          body: payloadString,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const responseText = await res.text().catch(() => "");

        const isSuccess = res.status >= 200 && res.status < 300;

        await prisma.developerWebhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: isSuccess ? "SUCCESS" : "FAILED",
            responseCode: res.status,
            responseBody: responseText.slice(0, 1000), // Cap length
          },
        });

        if (!isSuccess) {
          await prisma.developerWebhookEndpoint.update({
            where: { id: endpoint.id },
            data: { failureCount: { increment: 1 } },
          });
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        const errorMessage = err.name === "AbortError" ? "Webhook delivery timed out after 5s" : err.message;

        await prisma.developerWebhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "FAILED",
            responseCode: err.name === "AbortError" ? 504 : 500,
            responseBody: errorMessage?.slice(0, 500),
          },
        });

        await prisma.developerWebhookEndpoint.update({
          where: { id: endpoint.id },
          data: { failureCount: { increment: 1 } },
        });
      }
    } catch (outerErr) {
      console.error("[DEV WEBHOOK DISPATCH ERROR]", outerErr);
    }
  };

  try {
    after(runner);
  } catch {
    // If invoked outside after() scope (e.g. scripts/unit tests), execute asynchronously
    runner().catch((e) => console.error("[DEV WEBHOOK RUNNER ERROR]", e));
  }
}
