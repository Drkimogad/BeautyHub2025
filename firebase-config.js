// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyAScnUVBPj0-UhJaS8-AChYPMbDWqfEjD4",
  authDomain: "beautyhub-za.firebaseapp.com",
  projectId: "beautyhub-za",
  storageBucket: "beautyhub-za.firebasestorage.app",
  messagingSenderId: "945293822088",
  appId: "1:945293822088:web:879eede0f52df134f1f73d",
  measurementId: "G-XCQMS80N47"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export services
const auth = firebase.auth();

const firestore = firebase.firestore();

