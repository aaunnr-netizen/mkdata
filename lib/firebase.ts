import * as admin from "firebase-admin";
import { prisma } from "@/lib/db";

let fcmInitialized = false;

function initFirebase() {
  if (fcmInitialized) return true;

  try {
    if (admin.apps.length > 0) {
      fcmInitialized = true;
      return true;
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      console.warn("[FIREBASE] FIREBASE_SERVICE_ACCOUNT_JSON is not configured in env variables. Push notifications are disabled.");
      return false;
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    fcmInitialized = true;
    console.log("[FIREBASE] Firebase Admin SDK initialized successfully.");
    return true;
  } catch (error) {
    console.error("[FIREBASE] Failed to initialize Firebase Admin SDK:", error);
    return false;
  }
}

/**
 * Sends a push notification to a specific user
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  if (!initFirebase()) return { success: false, reason: "firebase_not_initialized" };

  try {
    const userTokens = await prisma.userFcmToken.findMany({
      where: { userId },
      select: { id: true, token: true },
    });

    if (userTokens.length === 0) {
      console.log(`[FIREBASE] No registered FCM tokens found for user ${userId}. Skipping.`);
      return { success: true, sentCount: 0 };
    }

    const tokens = userTokens.map((t) => t.token);
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title, body },
      data: data || {},
      android: {
        notification: {
          sound: "default",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[FIREBASE] Multicast result: ${response.successCount} success, ${response.failureCount} failed.`);

    // Prune invalid or expired tokens
    if (response.failureCount > 0) {
      const tokensToRemove: string[] = [];
      response.responses.forEach((res, index) => {
        if (!res.success && res.error) {
          const code = res.error.code;
          if (
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token"
          ) {
            tokensToRemove.push(tokens[index]);
          }
        }
      });

      if (tokensToRemove.length > 0) {
        await prisma.userFcmToken.deleteMany({
          where: { token: { in: tokensToRemove } },
        });
        console.log(`[FIREBASE] Pruned ${tokensToRemove.length} inactive FCM tokens.`);
      }
    }

    return { success: true, sentCount: response.successCount };
  } catch (error) {
    console.error("[FIREBASE] Error sending push notification:", error);
    return { success: false, error };
  }
}

/**
 * Broadcasts a push notification to all registered tokens
 */
export async function sendPushNotificationToAll(
  title: string,
  body: string,
  data?: Record<string, string>
) {
  if (!initFirebase()) return { success: false, reason: "firebase_not_initialized" };

  try {
    const allTokens = await prisma.userFcmToken.findMany({
      select: { token: true },
    });

    if (allTokens.length === 0) {
      console.log("[FIREBASE] No registered FCM tokens in the database. Skipping broadcast.");
      return { success: true, sentCount: 0 };
    }

    const tokens = allTokens.map((t) => t.token);
    
    // FCM multicast accepts max 500 tokens per call
    const chunkSize = 500;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < tokens.length; i += chunkSize) {
      const tokenChunk = tokens.slice(i, i + chunkSize);
      const message: admin.messaging.MulticastMessage = {
        tokens: tokenChunk,
        notification: { title, body },
        data: data || {},
        android: {
          notification: {
            sound: "default",
            clickAction: "FLUTTER_NOTIFICATION_CLICK",
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      successCount += response.successCount;
      failureCount += response.failureCount;

      // Prune failed tokens in this chunk
      if (response.failureCount > 0) {
        const tokensToRemove: string[] = [];
        response.responses.forEach((res, index) => {
          if (!res.success && res.error) {
            const code = res.error.code;
            if (
              code === "messaging/registration-token-not-registered" ||
              code === "messaging/invalid-registration-token"
            ) {
              tokensToRemove.push(tokenChunk[index]);
            }
          }
        });

        if (tokensToRemove.length > 0) {
          await prisma.userFcmToken.deleteMany({
            where: { token: { in: tokensToRemove } },
          });
        }
      }
    }

    console.log(`[FIREBASE] Broadcast complete. Sent successfully to ${successCount} devices, pruned ${failureCount} failed.`);
    return { success: true, sentCount: successCount };
  } catch (error) {
    console.error("[FIREBASE] Error sending broadcast push notification:", error);
    return { success: false, error };
  }
}
