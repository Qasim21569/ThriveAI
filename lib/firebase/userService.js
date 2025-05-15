import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth } from './firebaseConfig';

// Get Firestore instance
const db = getFirestore();

/**
 * Get user profile data from Firestore
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} - The user profile data or null if not found
 */
export const getUserProfile = async (userId) => {
  if (!userId) return null;
  
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      return { id: userDocSnap.id, ...userDocSnap.data() };
    } else {
      console.log('No user profile found for ID:', userId);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * Create or update user profile in Firestore
 * @param {string} userId - The user ID
 * @param {Object} profileData - The profile data to save
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const saveUserProfile = async (userId, profileData) => {
  if (!userId) return false;
  
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      // Update existing profile
      await updateDoc(userDocRef, profileData);
    } else {
      // Create new profile
      await setDoc(userDocRef, {
        ...profileData,
        createdAt: new Date().toISOString(),
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return false;
  }
};

/**
 * Get the current user's saved plans
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of saved plans
 */
export const getUserSavedPlans = async (userId) => {
  if (!userId) return [];
  
  try {
    console.log('Fetching plans for user ID:', userId);
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists() && userDocSnap.data().savedPlans) {
      const plans = userDocSnap.data().savedPlans;
      console.log(`Found ${plans.length} plans for user ${userId}`);
      return plans;
    } else {
      console.log(`No saved plans found for user ${userId}`);
      return [];
    }
  } catch (error) {
    console.error('Error fetching user saved plans:', error);
    return [];
  }
};

/**
 * Save a plan to the user's profile
 * @param {string} userId - The user ID
 * @param {Object} plan - The plan to save
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const savePlanToUserProfile = async (userId, plan) => {
  if (!userId) {
    console.error('Cannot save plan: No user ID provided');
    return false;
  }
  
  try {
    // Ensure plan has a unique ID
    if (!plan.id) {
      plan.id = `plan-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    console.log(`Saving plan ${plan.id} to user ${userId}`);
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    
    let savedPlans = [];
    
    if (userDocSnap.exists() && userDocSnap.data().savedPlans) {
      savedPlans = userDocSnap.data().savedPlans;
      console.log(`User has ${savedPlans.length} existing plans`);
    } else {
      console.log('First plan for this user');
      // Create a basic user document if it doesn't exist yet
      if (!userDocSnap.exists()) {
        try {
          await setDoc(userDocRef, {
            uid: userId,
            createdAt: new Date().toISOString(),
            savedPlans: []
          });
          console.log(`Created new user document for ${userId}`);
        } catch (error) {
          console.error('Error creating user document:', error);
          // Continue anyway to try saving the plan
        }
      }
    }
    
    // Check if plan already exists by ID or path
    const planIndex = savedPlans.findIndex(p => 
      (p.id === plan.id) || (p.path === plan.path && p.type === plan.type)
    );
    
    const timestamp = new Date().toISOString();
    
    if (planIndex !== -1) {
      // Update existing plan
      console.log(`Updating existing plan at index ${planIndex}`);
      savedPlans[planIndex] = { 
        ...plan, 
        updatedAt: timestamp 
      };
    } else {
      // Add new plan
      console.log('Adding new plan');
      savedPlans.push({ 
        ...plan, 
        createdAt: timestamp,
        updatedAt: timestamp 
      });
    }
    
    // Save plans to user document
    try {
      if (userDocSnap.exists()) {
        await updateDoc(userDocRef, { 
          savedPlans,
          lastUpdated: timestamp 
        });
      } else {
        // Create new user document with plans
        await setDoc(userDocRef, { 
          uid: userId,
          savedPlans,
          createdAt: timestamp,
          lastUpdated: timestamp
        });
      }
      
      console.log(`Successfully saved plan for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error writing to Firestore:', error);
      
      // Check for permission error specifically
      if (error.code === 'permission-denied') {
        console.error('Permission denied. Please check Firestore security rules.');
        console.error('Make sure rules allow authenticated users to write to their own documents:');
        console.error(`
          service cloud.firestore {
            match /databases/{database}/documents {
              match /users/{userId} {
                allow read, write: if request.auth != null && request.auth.uid == userId;
              }
            }
          }
        `);
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error saving plan to user profile:', error);
    return false;
  }
}; 