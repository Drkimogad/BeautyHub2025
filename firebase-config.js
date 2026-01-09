// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyB96xSqgk4gI1Z94ZXSESFlfbVMb3meo7U",
  authDomain: "beautyhub-5987d.firebaseapp.com",
  projectId: "beautyhub-5987d",
  storageBucket: "beautyhub-5987d.firebasestorage.app",
  messagingSenderId: "20539362118",
  appId: "1:20539362118:web:b15665bb331433c1ea7347",
  measurementId: "G-G1YQSSM8TK"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export services
const auth = firebase.auth();

const firestore = firebase.firestore();
