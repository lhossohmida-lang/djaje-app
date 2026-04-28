import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { sampleMenu } from "@/data/mock-data";
import { db } from "@/lib/firebase";

async function clearCollection(collectionName: string) {
  const snapshot = await getDocs(collection(db, collectionName));

  if (snapshot.empty) {
    return;
  }

  const batch = writeBatch(db);
  snapshot.docs.forEach((entry) => {
    batch.delete(doc(db, collectionName, entry.id));
  });
  await batch.commit();
}

export async function resetFactoryData() {
  await clearCollection("orders");
  await clearCollection("menuItems");

  const batch = writeBatch(db);
  sampleMenu.forEach((item) => {
    batch.set(doc(db, "menuItems", item.id), item);
  });
  await batch.commit();
}
