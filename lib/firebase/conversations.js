import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Create a new conversation in Firestore
 * @param {string} userId - The user's unique ID
 * @param {string} mode - The coaching mode (career, fitness, finance, mental)
 * @param {Array} initialMessages - Initial messages to include
 * @returns {Promise<object>} Status and the new conversation ID
 */
export const createConversation = async (userId, mode, initialMessages = []) => {
  try {
    // Generate a title based on the first user message or use a default
    let title = 'New Conversation';
    const userMessage = initialMessages.find(msg => msg.role === 'user');
    if (userMessage) {
      // Limit title length and add ellipsis if needed
      title = userMessage.content.length > 30 
        ? `${userMessage.content.substring(0, 30)}...` 
        : userMessage.content;
    }

    const conversationData = {
      userId,
      mode,
      messages: initialMessages.map(msg => ({
        ...msg,
        timestamp: new Date().toISOString()
      })),
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'conversations'), conversationData);
    return { 
      success: true, 
      conversationId: docRef.id,
      conversation: {
        id: docRef.id,
        ...conversationData
      }
    };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get a specific conversation by ID
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<object>} Conversation data or error
 */
export const getConversation = async (conversationId) => {
  try {
    const docRef = doc(db, 'conversations', conversationId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { 
        success: true, 
        conversation: {
          id: docSnap.id,
          ...docSnap.data()
        }
      };
    } else {
      return { success: false, error: 'Conversation not found' };
    }
  } catch (error) {
    console.error('Error getting conversation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all conversations for a user
 * @param {string} userId - The user's unique ID
 * @param {string} mode - Optional filter by coaching mode
 * @returns {Promise<object>} List of conversations or error
 */
export const getUserConversations = async (userId, mode = null) => {
  try {
    let q;
    if (mode) {
      q = query(
        collection(db, 'conversations'), 
        where('userId', '==', userId),
        where('mode', '==', mode),
        orderBy('updatedAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'conversations'), 
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const conversations = [];
    
    querySnapshot.forEach((doc) => {
      conversations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, conversations };
  } catch (error) {
    console.error('Error getting user conversations:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a conversation with new messages
 * @param {string} conversationId - The conversation ID
 * @param {Array} messages - Updated messages array
 * @param {string} title - Optional new title for the conversation
 * @returns {Promise<object>} Status of the operation
 */
export const updateConversation = async (conversationId, messages, title = null) => {
  try {
    const docRef = doc(db, 'conversations', conversationId);
    const updateData = {
      messages,
      updatedAt: serverTimestamp()
    };
    
    if (title) {
      updateData.title = title;
    }
    
    await updateDoc(docRef, updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating conversation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<object>} Status of the operation
 */
export const deleteConversation = async (conversationId) => {
  try {
    await deleteDoc(doc(db, 'conversations', conversationId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update conversation title
 * @param {string} conversationId - The conversation ID
 * @param {string} title - New title for the conversation
 * @returns {Promise<object>} Status of the operation
 */
export const updateConversationTitle = async (conversationId, title) => {
  try {
    const docRef = doc(db, 'conversations', conversationId);
    await updateDoc(docRef, {
      title,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating conversation title:', error);
    return { success: false, error: error.message };
  }
};
