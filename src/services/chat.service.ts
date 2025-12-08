
import ChatMessage, { ChatMessageAttributes } from '../models/chat.model';

/**
 * Saves a new chat message to the database.
 * Can include either a text message or a file.
 */
export const saveChatMessage = async (data: Partial<ChatMessageAttributes>): Promise<ChatMessage> => {
    try {
        const message = await ChatMessage.create({
            rideId: data.rideId!,
            senderId: data.senderId!,
            receiverId: data.receiverId!,
            message: data.message || null,
            fileContent: data.fileContent || undefined,
            fileType: data.fileType || undefined,
        });
        return message;
    } catch (error) {
        console.error("Error saving chat message:", error);
        throw new Error("Could not save chat message.");
    }
};

/**
 * Retrieves the chat history for a specific ride.
 */
export const getChatHistory = async (rideId: number): Promise<ChatMessage[]> => {
    try {
        return await ChatMessage.findAll({ where: { rideId }, order: [['createdAt', 'ASC']] });
    } catch (error) {
        console.error(`Error fetching chat history for ride ${rideId}:`, error);
        return [];
    }
};

export const sendMessage = async (rideId: number, senderId: number, receiverId: number, message: string): Promise<ChatMessage> => {
    return await saveChatMessage({ rideId, senderId, receiverId, message });
};

export const getRideMessages = async (rideId: number): Promise<ChatMessage[]> => {
    return await getChatHistory(rideId);
};
