// Email/password accounts with Firebase Auth. Signed-in users' progress is
// saved to Firestore at users/{uid}/progress/{puzzleId}; everyone else (or a
// failed write) falls back to localStorage. On first sign-in, a puzzle's
// local progress is carried over to the cloud.
import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, getFirestore, setDoc } from 'firebase/firestore';

// Web app config is public by design; access is controlled by firestore.rules.
const app = initializeApp({
  apiKey: 'AIzaSyAVMahXUS_6fZHkaP66xx6TvwNWXpItx_Q',
  authDomain: 'practiceapp-88669.firebaseapp.com',
  projectId: 'practiceapp-88669',
  storageBucket: 'practiceapp-88669.firebasestorage.app',
  messagingSenderId: '566825294063',
  appId: '1:566825294063:web:93e00a7e26b6dc4ba4631a',
});
const auth = getAuth(app);
const db = getFirestore(app);

export const watchUser = (cb) => onAuthStateChanged(auth, cb);
export const signUp = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const logIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const logOut = () => signOut(auth);

const AUTH_ERRORS = {
  'auth/configuration-not-found': 'Email/Password sign-in is not enabled in Firebase yet.',
  'auth/operation-not-allowed': 'Email/Password sign-in is not enabled in Firebase yet.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/invalid-email': 'That email address is not valid.',
  'auth/email-already-in-use': 'An account with this email already exists. Log in instead.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/missing-password': 'Enter a password.',
  'auth/too-many-requests': 'Too many attempts. Try again in a minute.',
};
export const authErrorText = (e) => AUTH_ERRORS[e?.code] || e?.message || 'Sign-in failed.';

const localKey = (id) => `logic-grid:${id}`;

export async function loadProgress(uid, id) {
  if (uid) {
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'progress', id));
      if (snap.exists()) return snap.data();
      // Nothing in the cloud yet: carry over progress made before signing in.
    } catch {
      /* fall back to local copy */
    }
  }
  try {
    return JSON.parse(localStorage.getItem(localKey(id)));
  } catch {
    return null;
  }
}

/** Returns 'cloud' or 'local' depending on where the save landed. */
export async function saveProgress(uid, id, data) {
  if (uid) {
    try {
      await setDoc(doc(db, 'users', uid, 'progress', id), { ...data, updatedAt: Date.now() });
      return 'cloud';
    } catch {
      /* fall back to local copy */
    }
  }
  try {
    localStorage.setItem(localKey(id), JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
  return 'local';
}

/** All of a signed-in user's saved puzzles, most recent first. */
export async function listProgress(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'progress'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

/** Ids of the puzzles marked solved, in this browser and (when signed in) in the cloud. */
export async function loadSolved(uid, ids) {
  const out = new Set();
  ids.forEach((id) => {
    try {
      if (JSON.parse(localStorage.getItem(localKey(id)))?.solved) out.add(id);
    } catch {
      /* storage unavailable */
    }
  });
  if (uid) {
    try {
      (await listProgress(uid)).forEach((d) => d.solved && out.add(d.id));
    } catch {
      /* offline: local copy only */
    }
  }
  return out;
}
