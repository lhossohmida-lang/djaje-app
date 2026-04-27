import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserRole } from "@/types";

export async function getUserRoleByUid(uid: string): Promise<UserRole | null> {
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) {
    return null;
  }

  const role = snapshot.data().role;
  return role === "admin" || role === "driver" ? role : null;
}
