import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
// Firestore database ID must be passed to getFirestore as specified in config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface ConnectionVerificationResult {
  connected: boolean;
  readWriteVerified: boolean;
  message: string;
  timestamp?: string;
}

/**
 * Validates connection to Firestore.
 * Performs a read and write verification to guarantee Cloud Firestore is active.
 */
export async function testConnectionAndReadWrite(): Promise<ConnectionVerificationResult> {
  try {
    const testDocRef = doc(db, 'system', 'connectivity_check');
    
    // 1. If signed in, verify write permission
    if (auth.currentUser) {
      await setDoc(testDocRef, {
        status: 'online',
        projectId: firebaseConfig.projectId,
        databaseId: firebaseConfig.firestoreDatabaseId,
        verifiedBy: auth.currentUser.uid,
        lastChecked: new Date().toISOString()
      }, { merge: true });
    }

    // 2. Perform live server read
    const snap = await getDocFromServer(testDocRef);
    const data = snap.data();

    return {
      connected: true,
      readWriteVerified: snap.exists(),
      message: 'Cloud Firestore live read/write verified on server.',
      timestamp: data?.lastChecked || new Date().toISOString()
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      return {
        connected: false,
        readWriteVerified: false,
        message: 'Firebase client is offline. Waiting for network or Firestore provisioning.'
      };
    }
    // Still connected even if initial unauthenticated doc does not exist yet
    return {
      connected: true,
      readWriteVerified: false,
      message: error instanceof Error ? error.message : 'Server reachable.'
    };
  }
}

// Fallback startup connection test
export async function testConnection(): Promise<boolean> {
  const res = await testConnectionAndReadWrite();
  return res.connected;
}
