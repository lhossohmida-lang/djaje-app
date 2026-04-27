import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MenuItem } from "@/types";
import { sampleMenu } from "@/data/mock-data";

const menuCollection = collection(db, "menuItems");

export function subscribeToMenu(callback: (items: MenuItem[]) => void) {
  return onSnapshot(query(menuCollection, orderBy("name")), (snapshot) => {
    if (snapshot.empty) {
      callback(sampleMenu);
      return;
    }

    callback(snapshot.docs.map((item) => item.data() as MenuItem));
  });
}

export async function createOrUpdateMenuItem(item: MenuItem) {
  await setDoc(doc(db, "menuItems", item.id), item);
}

export async function deleteMenuItem(itemId: string) {
  await deleteDoc(doc(db, "menuItems", itemId));
}

export async function seedMenuItems(items: MenuItem[] = sampleMenu) {
  await Promise.all(items.map((item) => addDoc(menuCollection, item)));
}
