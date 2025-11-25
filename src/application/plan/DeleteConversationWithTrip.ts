import { Effect } from "effect";
import { ConversationRepository, TripRepository } from "@/infrastructure/plan/database/repositories";

/**
 * Delete a conversation and its associated trip (cascade deletion).
 *
 * This use case implements application-level cascade deletion to ensure that
 * when a conversation is deleted, any associated trip is also removed from the database.
 *
 * Flow:
 * 1. Check if there's a trip associated with the conversation
 * 2. If trip exists, delete it first (maintains referential integrity)
 * 3. Delete the conversation
 *
 * @param userId - The user ID (for scoping)
 * @param conversationId - The conversation ID to delete
 * @returns Effect that resolves to void on success, or fails with DatabaseError
 */
export const DeleteConversationWithTrip = (userId: string, conversationId: string) =>
  Effect.gen(function* () {
    const tripRepo = yield* TripRepository;
    const conversationRepo = yield* ConversationRepository;

    // Check if there's an associated trip
    const trip = yield* tripRepo.findByConversationId(userId, conversationId);

    // If trip exists, delete it first to maintain referential integrity
    if (trip !== null) {
      yield* tripRepo.delete(userId, trip.id);
    }

    // Delete the conversation
    yield* conversationRepo.delete(userId, conversationId);
  });
