import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Save user profile data to Firestore
 * @param {string} userId - The user's unique ID
 * @param {object} profileData - User profile information
 * @returns {Promise<object>} Status of the operation
 */
export const saveUserProfile = async (userId, profileData) => {
  try {
    await setDoc(doc(db, 'userProfiles', userId), {
      ...profileData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user profile data from Firestore
 * @param {string} userId - The user's unique ID
 * @returns {Promise<object>} User profile data or error
 */
export const getUserProfile = async (userId) => {
  try {
    const docRef = doc(db, 'userProfiles', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: 'Profile not found' };
    }
  } catch (error) {
    console.error('Error getting profile:', error);
    return { success: false, error: error.message };
  }
}; 