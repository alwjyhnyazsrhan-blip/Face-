/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { DbPatient, DbTherapySession, DbAssessment, DbUserProfile } from '../types';

// ==================== AUTH SERVICE ====================

export const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check or create user profile in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      const newProfile: DbUserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'مختص التأهيل العصبي',
        role: 'clinician',
        createdAt: new Date().toISOString(),
        photoURL: user.photoURL || undefined,
      };
      await setDoc(userDocRef, newProfile);
    }

    return user;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'users');
  }
}

export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// ==================== PATIENTS SERVICE ====================

export async function getPatients(): Promise<DbPatient[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const path = 'patients';
  try {
    const q = query(collection(db, path), where('ownerId', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);
    const patients: DbPatient[] = [];
    querySnapshot.forEach((d) => {
      patients.push(d.data() as DbPatient);
    });
    return patients;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToPatients(callback: (patients: DbPatient[]) => void): Unsubscribe {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    callback([]);
    return () => {};
  }

  const path = 'patients';
  const q = query(collection(db, path), where('ownerId', '==', currentUser.uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const patients: DbPatient[] = [];
      snapshot.forEach((d) => {
        patients.push(d.data() as DbPatient);
      });
      callback(patients);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function savePatient(patient: DbPatient): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('User must be signed in to save patient');

  const path = `patients/${patient.id}`;
  try {
    const patientData = {
      ...patient,
      ownerId: currentUser.uid,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'patients', patient.id), patientData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePatient(patientId: string): Promise<void> {
  const path = `patients/${patientId}`;
  try {
    await deleteDoc(doc(db, 'patients', patientId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==================== THERAPY SESSIONS SERVICE ====================

export async function getTherapySessions(patientId?: string): Promise<DbTherapySession[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const path = 'therapy_sessions';
  try {
    let q = query(collection(db, path), where('userId', '==', currentUser.uid));
    if (patientId) {
      q = query(
        collection(db, path),
        where('userId', '==', currentUser.uid),
        where('patientId', '==', patientId)
      );
    }
    const querySnapshot = await getDocs(q);
    const sessions: DbTherapySession[] = [];
    querySnapshot.forEach((d) => {
      sessions.push(d.data() as DbTherapySession);
    });
    return sessions;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToTherapySessions(callback: (sessions: DbTherapySession[]) => void): Unsubscribe {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    callback([]);
    return () => {};
  }

  const path = 'therapy_sessions';
  const q = query(collection(db, path), where('userId', '==', currentUser.uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const sessions: DbTherapySession[] = [];
      snapshot.forEach((d) => {
        sessions.push(d.data() as DbTherapySession);
      });
      callback(sessions);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveTherapySession(session: DbTherapySession): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('User must be signed in to save session');

  const path = `therapy_sessions/${session.id}`;
  try {
    const sessionData = {
      ...session,
      userId: currentUser.uid,
    };
    await setDoc(doc(db, 'therapy_sessions', session.id), sessionData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==================== ASSESSMENTS SERVICE ====================

export async function getAssessments(patientId?: string): Promise<DbAssessment[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const path = 'assessments';
  try {
    let q = query(collection(db, path), where('userId', '==', currentUser.uid));
    if (patientId) {
      q = query(
        collection(db, path),
        where('userId', '==', currentUser.uid),
        where('patientId', '==', patientId)
      );
    }
    const querySnapshot = await getDocs(q);
    const assessments: DbAssessment[] = [];
    querySnapshot.forEach((d) => {
      assessments.push(d.data() as DbAssessment);
    });
    return assessments;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToAssessments(callback: (assessments: DbAssessment[]) => void): Unsubscribe {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    callback([]);
    return () => {};
  }

  const path = 'assessments';
  const q = query(collection(db, path), where('userId', '==', currentUser.uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const assessments: DbAssessment[] = [];
      snapshot.forEach((d) => {
        assessments.push(d.data() as DbAssessment);
      });
      callback(assessments);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveAssessment(assessment: DbAssessment): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('User must be signed in to save assessment');

  const path = `assessments/${assessment.id}`;
  try {
    const assessmentData = {
      ...assessment,
      userId: currentUser.uid,
    };
    await setDoc(doc(db, 'assessments', assessment.id), assessmentData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
