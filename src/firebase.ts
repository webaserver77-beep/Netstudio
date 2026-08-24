import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  onSnapshot,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import firebaseConfigJson from '../firebase-applet-config.json';
import { MediaItem, Movie } from './types';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
  firestoreDatabaseId: (firebaseConfigJson as any).firestoreDatabaseId
};

// Initialize Firebase App
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore targeting the dedicated production database ID
const db: Firestore = (firebaseConfigJson as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfigJson as any).firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth
const auth: Auth = getAuth(app);

// 1. Universal Real-Time Listener (Runs on EVERY user's device/browser)
export function subscribeMovies(onData: (movies: Movie[]) => void) {
  const moviesCollection = collection(db, 'movies');

  // onSnapshot automatically pushes any admin changes to all connected devices instantly
  return onSnapshot(moviesCollection, (snapshot) => {
    const updatedMovies = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    } as Movie));

    onData(updatedMovies);
  }, (error) => {
    console.warn('[subscribeMovies] Real-time listener warning:', error);
  });
}

// 2. Admin Write Operations (Persists globally across the cloud)
export async function addMovieToFirestore(movie: Movie): Promise<void> {
  const docRef = doc(db, 'movies', movie.id);
  await setDoc(docRef, movie);
}

export async function updateMovieInFirestore(id: string, updates: Partial<Movie>): Promise<void> {
  const docRef = doc(db, 'movies', id);
  await updateDoc(docRef, updates);
}

export async function deleteMovieFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, 'movies', id);
  await deleteDoc(docRef);
}

export {
  app,
  db,
  auth,
  collection,
  doc,
  onSnapshot,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
export default db;
