import {
  doc,
  updateDoc,
  increment,
  Timestamp,
  serverTimestamp,
  where,
  getDocs,
  collection,
  query,
} from "firebase/firestore";
import { db } from "../../firebase";
import { Advancement, STATISTICS, USER_ID } from "./constants";
import { useAuth } from "./useAuth";

const { uid } = useAuth();

const getUserStatisticsDoc = async () => {
  const { uid } = useAuth();
  if (!uid.value) return null;

  const q = query(collection(db, STATISTICS), where(USER_ID, "==", uid.value));

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  return snapshot.docs[0];
};

export const increaseWordsLearnedByOne = async () => {
  const statDoc = await getUserStatisticsDoc();
  if (!statDoc) return;

  await updateDoc(statDoc.ref, {
    words_learned: increment(1),
  });
};

export const decreaseWordsLearnedByOne = async () => {
  const statDoc = await getUserStatisticsDoc();
  if (!statDoc) return;

  await updateDoc(statDoc.ref, {
    words_learned: increment(-1),
  });
};

export const increaseCyclesByOne = async () => {
  const statDoc = await getUserStatisticsDoc();
  if (!statDoc) return;

  await updateDoc(statDoc.ref, {
    cycles: increment(1),
  });
};

export const updateDayStreak = async () => {
  if (!uid.value) return;

  const q = query(collection(db, STATISTICS), where(USER_ID, "==", uid.value));

  const snapshot = await getDocs(q);
  if (snapshot.empty) return;

  const statDoc = snapshot.docs[0];
  const data = statDoc!.data();
  const lastActivity = data.last_activity as Timestamp | undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!lastActivity) {
    await updateDoc(statDoc!.ref, {
      days: 1,
      last_activity: serverTimestamp(),
    });
    return;
  }

  const lastDate = lastActivity.toDate();
  lastDate.setHours(0, 0, 0, 0);

  const diffDays =
    (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays === 0) return;

  if (diffDays === 1) {
    await updateDoc(statDoc!.ref, {
      days: increment(1),
      last_activity: serverTimestamp(),
    });
    return;
  }

  if (diffDays > 1) {
    await updateDoc(statDoc!.ref, {
      days: 0,
      last_activity: serverTimestamp(),
    });
  }
};

export const getDayAdvancement = async () => {
  if (!uid.value) return;

  const q = query(collection(db, STATISTICS), where(USER_ID, "==", uid.value));

  const snapshot = await getDocs(q);
  if (snapshot.empty) return;

  const statDoc = snapshot.docs[0];
  const data = statDoc!.data();

  switch (data.days) {
    case 1:
      return Advancement.ONEDAYSTREAK;
    case 3:
      return Advancement.THREEDAYSTREAK;
    case 7:
      return Advancement.WEEKSTREAK;
    case 14:
      return Advancement.TWOWEEKSTREAK;
    case 21:
      return Advancement.THREEWEEKSTREAK;
    case 30:
      return Advancement.MONTHSTREAK;
    case 60:
      return Advancement.TWOMONTHSTREAK;
    case 180:
      return Advancement.SIXMONTHSTREAK;
    case 365:
      return Advancement.ONEYEARSTREAK;
    default:
      return null;
  }
};
