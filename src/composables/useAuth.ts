import { ref, computed } from "vue";
import { auth, db, googleProvider } from "../../firebase";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import router from "./router";
import type { AppUser } from "@/type/interfaces";
import Cookies from "js-cookie";
import {
  LANGUAGE_ID_COOKIE,
  NAME,
  PHOTO_URL,
  UID,
  USERS,
  WORDS_ROUTE,
} from "./constants";

const user = ref<FirebaseUser | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const languageId = ref(Cookies.get(LANGUAGE_ID_COOKIE) ?? null);

const uid = computed(() => user.value?.uid ?? null);
const photoURL = computed(() => user.value?.photoURL ?? null);
const displayName = computed(() => user.value?.displayName ?? null);

const setLanguageId = (id: string) => {
  Cookies.set(LANGUAGE_ID_COOKIE, id);
  languageId.value = id;
};

export function useAuth() {
  const checkIfUserIsRegistered = async (
    firebaseUser: FirebaseUser
  ): Promise<boolean> => {
    const userRef = doc(db, USERS, firebaseUser.uid);
    const snap = await getDoc(userRef);
    return snap.exists();
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      error.value = null;

      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const appUser: AppUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName!,
        photoURL: firebaseUser.photoURL!,
        provider: firebaseUser.providerData[0]?.providerId,
        createdAt: Timestamp.fromDate(new Date()),
      };

      await setDoc(doc(db, USERS, firebaseUser.uid), appUser, {
        merge: true,
      });

      Cookies.set(UID, firebaseUser.uid);
      Cookies.set(NAME, firebaseUser.displayName || "");
      Cookies.set(PHOTO_URL, firebaseUser.photoURL || "");

      router.push(WORDS_ROUTE);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Authentication failed";
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      user.value = null;
      Cookies.remove(UID);
      Cookies.remove(NAME);
      Cookies.remove(PHOTO_URL);
      router.push("/");
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Logout failed";
    }
  };

  onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      if (!firebaseUser) {
        user.value = null;
        return;
      }

      const isRegistered = await checkIfUserIsRegistered(firebaseUser);

      if (!isRegistered) {
        await logout();
        return;
      }

      user.value = firebaseUser;
    } finally {
      loading.value = false;
    }
  });

  return {
    user,
    photoURL,
    displayName,
    uid,
    languageId,
    loading,
    error,
    signInWithGoogle,
    logout,
    setLanguageId,
  };
}
