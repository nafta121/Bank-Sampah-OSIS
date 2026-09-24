import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  ClassProfile,
  WasteTransaction,
  RewardRedemption,
  NotificationItem,
} from '../types/index.ts';
import { INITIAL_CLASSES, REWARD_ITEMS } from '../constants/wasteData.ts';

// 1. Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

// 2. Google OAuth Provider for Workspace Google Sheets integration
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuthListener = (
  onSuccess?: (user: User, token: string | null) => void,
  onSignedOut?: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (onSuccess) onSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onSignedOut) onSignedOut();
    }
  });
};

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string | null }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = () => cachedAccessToken;

export const logoutFirebase = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// 3. Error Handling according to Firebase Skill standard
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// 4. Test Connection on Startup
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or in disconnected mode.');
    }
    return false;
  }
}

// 5. Seed initial classes if database is empty
export async function seedInitialClasses() {
  try {
    const snap = await getDocs(collection(db, 'classes'));
    if (snap.empty) {
      for (const cls of INITIAL_CLASSES) {
        await setDoc(doc(db, 'classes', cls.classId), {
          ...cls,
          updatedAt: new Date().toISOString(),
        });
      }
      // Add initial welcome notification
      const welcomeNotif: NotificationItem = {
        notificationId: `notif-${Date.now()}`,
        classId: 'all',
        className: 'Semua Kelas',
        title: 'Selamat Datang di Bank Sampah OSIS!',
        message: 'Ayo pilah sampah dari kelasmu dan kumpulkan poin untuk ditukarkan dengan hadiah menarik!',
        type: 'milestone',
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'notifications', welcomeNotif.notificationId), welcomeNotif);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'classes');
  }
}

// 6. Firestore Listeners and Operations
export function subscribeToClasses(
  callback: (classes: ClassProfile[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, 'classes'),
    (snap) => {
      const data: ClassProfile[] = [];
      snap.forEach((d) => {
        data.push(d.data() as ClassProfile);
      });
      callback(data);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'classes');
      if (onError) onError(error);
    }
  );
}

export function subscribeToTransactions(
  callback: (txs: WasteTransaction[]) => void,
  onError?: (err: any) => void
) {
  const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'), limit(150));
  return onSnapshot(
    q,
    (snap) => {
      const data: WasteTransaction[] = [];
      snap.forEach((d) => {
        data.push(d.data() as WasteTransaction);
      });
      callback(data);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'transactions');
      if (onError) onError(error);
    }
  );
}

export function subscribeToNotifications(
  callback: (notifs: NotificationItem[]) => void,
  onError?: (err: any) => void
) {
  const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      const data: NotificationItem[] = [];
      snap.forEach((d) => {
        data.push(d.data() as NotificationItem);
      });
      callback(data);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'notifications');
      if (onError) onError(error);
    }
  );
}

export function subscribeToRedemptions(
  callback: (redemptions: RewardRedemption[]) => void,
  onError?: (err: any) => void
) {
  const q = query(collection(db, 'redemptions'), orderBy('requestedAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      const data: RewardRedemption[] = [];
      snap.forEach((d) => {
        data.push(d.data() as RewardRedemption);
      });
      callback(data);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'redemptions');
      if (onError) onError(error);
    }
  );
}

export async function saveTransactionToFirestore(
  tx: WasteTransaction,
  currentClass: ClassProfile
) {
  try {
    // 1. Save transaction doc
    await setDoc(doc(db, 'transactions', tx.transactionId), tx);

    // 2. Update class accumulated points, balance, weight
    const newPoints = (currentClass.points || 0) + tx.pointsEarned;
    const newBalance = (currentClass.balance || 0) + tx.cashEarned;
    const newTotalWeight = Number(((currentClass.totalWeightKg || 0) + tx.weightKg).toFixed(2));

    const updatedClass: ClassProfile = {
      ...currentClass,
      points: newPoints,
      balance: newBalance,
      totalWeightKg: newTotalWeight,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'classes', currentClass.classId), updatedClass);

    // 3. Automated notification system: check if class balance/points meet any reward thresholds!
    await checkAndSendRewardNotification(updatedClass);

    return updatedClass;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `transactions/${tx.transactionId}`);
    throw err;
  }
}

// System notification trigger when balance or points are sufficient for rewards
export async function checkAndSendRewardNotification(cls: ClassProfile) {
  try {
    const affordableRewards = REWARD_ITEMS.filter(
      (r) => cls.points >= r.pointsCost || cls.balance >= r.cashCost
    );

    if (affordableRewards.length > 0) {
      // Find the highest reward they can claim
      const bestReward = affordableRewards[affordableRewards.length - 1];
      const notifId = `notif-reward-${cls.classId}-${Date.now()}`;
      const notif: NotificationItem = {
        notificationId: notifId,
        classId: cls.classId,
        className: cls.name,
        title: `🎉 Saldo ${cls.name} Siap Ditukar!`,
        message: `Keren! Saldo kas Rp ${cls.balance.toLocaleString('id-ID')} & ${cls.points} poin sudah cukup untuk ditukarkan dengan "${bestReward.title}". Silakan hubungi pengurus OSIS Bank Sampah!`,
        type: 'reward_ready',
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'notifications', notifId), notif);
    }
  } catch (err) {
    console.warn('Failed to send auto notification:', err);
  }
}

export async function redeemRewardInFirestore(
  cls: ClassProfile,
  reward: (typeof REWARD_ITEMS)[0],
  useBalance: boolean
) {
  try {
    const redemptionId = `redemption-${Date.now()}`;
    const pointsToDeduct = useBalance ? 0 : reward.pointsCost;
    const cashToDeduct = useBalance ? reward.cashCost : 0;

    const newPoints = Math.max(0, cls.points - pointsToDeduct);
    const newBalance = Math.max(0, cls.balance - cashToDeduct);

    const redemptionDoc: RewardRedemption = {
      redemptionId,
      classId: cls.classId,
      className: cls.name,
      rewardTitle: reward.title,
      pointsSpent: pointsToDeduct,
      cashSpent: cashToDeduct,
      status: 'approved',
      requestedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'redemptions', redemptionId), redemptionDoc);

    const updatedClass: ClassProfile = {
      ...cls,
      points: newPoints,
      balance: newBalance,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'classes', cls.classId), updatedClass);

    // Send redemption confirmation notification
    const notifId = `notif-claimed-${Date.now()}`;
    const claimNotif: NotificationItem = {
      notificationId: notifId,
      classId: cls.classId,
      className: cls.name,
      title: `🎁 Penukaran Berhasil: ${reward.title}`,
      message: `Kelas ${cls.name} berhasil menukarkan "${reward.title}". Hubungi Seksi Kebersihan OSIS untuk serah terima fisik/dana!`,
      type: 'reward_ready',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'notifications', notifId), claimNotif);

    return updatedClass;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'redemptions');
    throw err;
  }
}
