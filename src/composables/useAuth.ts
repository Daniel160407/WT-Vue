import { ref } from "vue";
import { auth, db, googleProvider } from "../../firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { USERS, WORDS_ROUTE } from "./constants";
import router from "./router";

const user = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

export function useAuth() {
  const checkIfUserIsRegistered = async (user: any) => {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const findedUser = users.find((u: any) => u?.email === user?.email);

    return !!findedUser;
  };

  const signInWithGoogle = async () => {
    try {
      error.value = null;

      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      await setDoc(
        doc(db, USERS, firebaseUser.uid),
        {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          provider: firebaseUser.providerData[0]?.providerId,
          createdAt: new Date(),
        },
        { merge: true }
      );
    } catch (err: any) {
      error.value = err.message;
    } finally {
      router.push(WORDS_ROUTE);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      user.value = null;
    } catch (err: any) {
      error.value = err.message;
    }
  };

  onAuthStateChanged(auth, async (u) => {
    const isAdmin = await checkIfUserIsRegistered(u);
    if (!isAdmin) {
      logout();
    } else {
      user.value = u;
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
