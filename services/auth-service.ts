import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerDriverAccount(payload: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}) {
  const credential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);

  await setDoc(doc(db, "users", credential.user.uid), {
    uid: credential.user.uid,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    role: "driver"
  });

  return credential;
}

export async function registerAdminAccount(payload: {
  email: string;
  password: string;
  fullName: string;
}) {
  const credential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);

  await setDoc(doc(db, "users", credential.user.uid), {
    uid: credential.user.uid,
    fullName: payload.fullName,
    email: payload.email,
    role: "admin"
  });

  return credential;
}

export async function logout() {
  return signOut(auth);
}
