import { db } from './firebaseConfig';
import { collection, addDoc, getDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';

// Collection reference
const goalsCollection = collection(db, 'goals');

/**
 * Create a new goal for a user
 * @param {string} userId - The user ID
 * @param {Object} goalData - The goal data
 * @param {string} goalData.title - Goal title
 * @param {string} goalData.description - Goal description
 * @param {string} goalData.mode - Coaching mode (career, fitness, finance, mental)
 * @param {Date} goalData.targetDate - Target completion date
 * @param {string} goalData.status - Goal status (active, completed, abandoned)
 * @param {number} goalData.initialValue - Initial value (if applicable)
 * @param {number} goalData.targetValue - Target value (if applicable)
 * @param {string} goalData.unit - Unit of measurement (if applicable)
 * @returns {Promise<string>} - The ID of the created goal
 */
export const createGoal = async (userId, goalData) => {
  try {
    // Add timestamp data
    const goalWithMetadata = {
      ...goalData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: goalData.status || 'active',
      progress: []
    };
    
    const docRef = await addDoc(goalsCollection, goalWithMetadata);
    return docRef.id;
  } catch (error) {
    console.error('Error creating goal:', error);
    throw error;
  }
};

/**
 * Get all goals for a user
 * @param {string} userId - The user ID
 * @param {string} mode - Optional coaching mode filter
 * @param {string} status - Optional status filter
 * @returns {Promise<Array>} - Array of goal objects
 */
export const getUserGoals = async (userId, mode = null, status = null) => {
  try {
    let q = query(goalsCollection, where('userId', '==', userId));
    
    // Add additional filters if provided
    if (mode) {
      q = query(q, where('mode', '==', mode));
    }
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    // Order by creation date (newest first)
    q = query(q, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const goals = [];
    
    querySnapshot.forEach((doc) => {
      goals.push({
        id: doc.id,
        ...doc.data(),
        // Convert timestamps to JS dates for easier handling in the frontend
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        targetDate: doc.data().targetDate?.toDate() || null
      });
    });
    
    return goals;
  } catch (error) {
    console.error('Error getting user goals:', error);
    throw error;
  }
};

/**
 * Get a specific goal by ID
 * @param {string} goalId - The goal ID
 * @returns {Promise<Object>} - The goal object
 */
export const getGoalById = async (goalId) => {
  try {
    const docRef = doc(db, 'goals', goalId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const goalData = docSnap.data();
      return {
        id: docSnap.id,
        ...goalData,
        // Convert timestamps to JS dates
        createdAt: goalData.createdAt.toDate(),
        updatedAt: goalData.updatedAt.toDate(),
        targetDate: goalData.targetDate?.toDate() || null
      };
    } else {
      throw new Error('Goal not found');
    }
  } catch (error) {
    console.error('Error getting goal:', error);
    throw error;
  }
};

/**
 * Update a goal
 * @param {string} goalId - The goal ID
 * @param {Object} goalData - The updated goal data
 * @returns {Promise<void>}
 */
export const updateGoal = async (goalId, goalData) => {
  try {
    const docRef = doc(db, 'goals', goalId);
    
    // Add updated timestamp
    const updatedGoalData = {
      ...goalData,
      updatedAt: Timestamp.now()
    };
    
    await updateDoc(docRef, updatedGoalData);
  } catch (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
};

/**
 * Delete a goal
 * @param {string} goalId - The goal ID
 * @returns {Promise<void>}
 */
export const deleteGoal = async (goalId) => {
  try {
    const docRef = doc(db, 'goals', goalId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
};

/**
 * Add a progress update to a goal
 * @param {string} goalId - The goal ID
 * @param {Object} progressData - The progress data
 * @param {number} progressData.value - Current value
 * @param {string} progressData.notes - Optional notes about the progress
 * @returns {Promise<void>}
 */
export const addProgressUpdate = async (goalId, progressData) => {
  try {
    const goalRef = doc(db, 'goals', goalId);
    const goalSnap = await getDoc(goalRef);
    
    if (!goalSnap.exists()) {
      throw new Error('Goal not found');
    }
    
    const goalData = goalSnap.data();
    const progressEntry = {
      ...progressData,
      date: Timestamp.now()
    };
    
    // Add the new progress entry to the progress array
    const updatedProgress = [...(goalData.progress || []), progressEntry];
    
    // Update the goal with the new progress array and updated timestamp
    await updateDoc(goalRef, {
      progress: updatedProgress,
      updatedAt: Timestamp.now(),
      // If the goal has a current value field, update it
      currentValue: progressData.value !== undefined ? progressData.value : goalData.currentValue
    });
  } catch (error) {
    console.error('Error adding progress update:', error);
    throw error;
  }
};

/**
 * Get progress history for a goal
 * @param {string} goalId - The goal ID
 * @returns {Promise<Array>} - Array of progress entries
 */
export const getGoalProgress = async (goalId) => {
  try {
    const goalRef = doc(db, 'goals', goalId);
    const goalSnap = await getDoc(goalRef);
    
    if (!goalSnap.exists()) {
      throw new Error('Goal not found');
    }
    
    const goalData = goalSnap.data();
    
    // Convert timestamp to JS Date for each progress entry
    const progressWithDates = (goalData.progress || []).map(entry => ({
      ...entry,
      date: entry.date.toDate()
    }));
    
    // Sort by date (newest first)
    return progressWithDates.sort((a, b) => b.date - a.date);
  } catch (error) {
    console.error('Error getting goal progress:', error);
    throw error;
  }
};
