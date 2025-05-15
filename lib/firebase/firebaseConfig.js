import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Using direct configuration values to avoid environment variable issues
const firebaseConfig = {
  apiKey: "AIzaSyCJCsf_jbXaz3psa_O-_m8LV5c-dPxij6s",
  authDomain: "ai-therapist-b8aa1.firebaseapp.com",
  projectId: "ai-therapist-b8aa1",
  storageBucket: "ai-therapist-b8aa1.firebasestorage.app",
  messagingSenderId: "444657299013",
  appId: "1:444657299013:web:316f40b1da8f9954a87d2c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// IMPORTANT: Make sure Firestore security rules are set properly in Firebase Console
// For proper permission to save mental wellbeing assessments, use rules like:
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /users/{userId} {
//       allow read, write: if request.auth != null && request.auth.uid == userId;
//     }
//   }
// }

export { auth, db }; 