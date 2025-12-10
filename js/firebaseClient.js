import { db } from "./firebaseConfig.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

function normalizePathToFirestore(path) {
  // Firestore paths must alternate collection/doc.
  // We accept arbitrary slash paths and map them to a collection name and doc id.
  const segments = String(path).split('/').filter(Boolean);
  if (segments.length === 0) return { col: 'app_data', id: 'root' };

  // Special-case auth/users/<emailKey> → collection 'auth_users', doc '<emailKey>'
  if (segments.length === 3 && segments[0] === 'auth' && segments[1] === 'users') {
    return { col: 'auth_users', id: segments[2] };
  }

  // For even segments (2): use segments[0] as collection and segments[1] as doc
  if (segments.length === 2) {
    return { col: segments[0].replaceAll(':','_'), id: segments[1] };
  }

  // For 1 segment: use a generic collection 'app_data' with id = segment
  if (segments.length === 1) {
    return { col: 'app_' + segments[0].replaceAll(':','_'), id: 'data' };
  }

  // For >=3 segments: collapse all but last into collection name, last as doc id
  const id = segments.pop();
  const col = segments.join('_').replaceAll(':','_');
  return { col, id };
}

export const FirebaseClient = {
  async save(path, data) {
    try {
      const { col, id } = normalizePathToFirestore(path);
      await setDoc(doc(db, col, id), data);
      return true;
    } catch (err) {
      console.warn("⚠ Firestore save failed:", err);
      return false;
    }
  },

  async load(path) {
    try {
      const { col, id } = normalizePathToFirestore(path);
      const snap = await getDoc(doc(db, col, id));
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      console.warn("⚠ Firestore load failed:", err);
      return null;
    }
  },

  async patch(path, data) {
    try {
      const { col, id } = normalizePathToFirestore(path);
      await updateDoc(doc(db, col, id), data);
      return true;
    } catch (err) {
      console.warn("⚠ Firestore patch failed:", err);
      return false;
    }
  },

  async remove(path) {
    try {
      const { col, id } = normalizePathToFirestore(path);
      await deleteDoc(doc(db, col, id));
      return true;
    } catch (err) {
      console.warn("⚠ Firestore remove failed:", err);
      return false;
    }
  }
};

// Expose globally for non-module consumers
try { window.FirebaseClient = FirebaseClient; } catch {}