import { ref } from "vue";
import { auth, db, googleProvider } from "../../firebase";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { USERS, WORDS_ROUTE } from "./constants";
import router from "./router";
import type { AppUser } from "@/type/interfaces";

const user = ref<FirebaseUser | null>(null);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);

export function useAuth() {
  const checkIfUserIsRegistered = async (
    firebaseUser: FirebaseUser | null
  ): Promise<boolean> => {
    if (!firebaseUser?.email) return false;

    const usersRef = collection(db, USERS);
    const snapshot = await getDocs(usersRef);

    const users: AppUser[] = snapshot.docs.map(
      (doc: QueryDocumentSnapshot) => doc.data() as AppUser
    );

    return users.some((u) => u.email === firebaseUser.email);
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      error.value = null;

      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const appUser: AppUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        provider: firebaseUser.providerData[0]?.providerId,
        createdAt: new Date(),
      };

      await setDoc(doc(db, USERS, firebaseUser.uid), appUser, {
        merge: true,
      });

      router.push(WORDS_ROUTE);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      user.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
    }
  };

  onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      user.value = null;
      loading.value = false;
      return;
    }

    const isRegistered = await checkIfUserIsRegistered(firebaseUser);

    if (!isRegistered) {
      await logout();
    } else {
      user.value = firebaseUser;
    }

    loading.value = false;
  });

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    logout,
  };
}
