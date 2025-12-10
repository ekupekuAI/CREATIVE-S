import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCXxNtlqO6a304lERXjw4hQzxV51A4EeQA",
  authDomain: "creative-studio-22d3b.firebaseapp.com",
  projectId: "creative-studio-22d3b",
  storageBucket: "creative-studio-22d3b.firebasestorage.app",
  messagingSenderId: "176743596862",
  appId: "1:176743596862:web:6494c97892cef47d3ee26f",
  measurementId: "G-4C49JCSE2F"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };