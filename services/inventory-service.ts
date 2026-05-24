import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ingredient, IngredientPurchase } from "@/types";

const INGREDIENTS_COL = "ingredients";
const PURCHASES_COL = "ingredient_purchases";

// Get all raw ingredients sorted by creation date
export function subscribeToIngredients(callback: (ingredients: Ingredient[]) => void) {
  const q = query(collection(db, INGREDIENTS_COL), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    })) as Ingredient[];
    callback(list);
  });
}

// Add a new ingredient definition
export async function addIngredient({ name, unit }: { name: string; unit: string }) {
  return await addDoc(collection(db, INGREDIENTS_COL), {
    name,
    unit: unit || "وحدة",
    totalStock: 0,
    totalSpent: 0,
    purchaseCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

// Update ingredient information (e.g. name or unit)
export async function updateIngredient(id: string, payload: { name?: string; unit?: string }) {
  const ref = doc(db, INGREDIENTS_COL, id);
  const data: Record<string, any> = { updatedAt: serverTimestamp() };
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.unit !== undefined) data.unit = payload.unit;
  await updateDoc(ref, data);
}

// Delete ingredient and all its individual purchases
export async function deleteIngredient(id: string) {
  // 1. Delete associated purchases
  const q = query(collection(db, PURCHASES_COL), where("ingredientId", "==", id));
  const snap = await getDocs(q);
  const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);

  // 2. Delete parent document
  await deleteDoc(doc(db, INGREDIENTS_COL, id));
}

// Add a raw stock purchase and update parent aggregates
export async function addIngredientPurchase({
  ingredientId,
  quantity,
  unitPrice,
  note
}: {
  ingredientId: string;
  quantity: number;
  unitPrice: number;
  note?: string;
}) {
  const qty = Number(quantity) || 0;
  const price = Number(unitPrice) || 0;
  const totalCost = qty * price;

  // 1. Log individual purchase invoice
  await addDoc(collection(db, PURCHASES_COL), {
    ingredientId,
    quantity: qty,
    unitPrice: price,
    totalCost,
    note: note || "",
    createdAt: serverTimestamp()
  });

  // 2. Update cumulative metrics in parent ingredient document
  const ref = doc(db, INGREDIENTS_COL, ingredientId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    await updateDoc(ref, {
      totalStock: (data.totalStock || 0) + qty,
      totalSpent: (data.totalSpent || 0) + totalCost,
      purchaseCount: (data.purchaseCount || 0) + 1,
      lastPurchaseAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}

// Get individual purchases for a specific ingredient
export function subscribeToIngredientPurchases(
  ingredientId: string,
  callback: (purchases: IngredientPurchase[]) => void
) {
  const q = query(
    collection(db, PURCHASES_COL),
    where("ingredientId", "==", ingredientId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    })) as IngredientPurchase[];
    callback(list);
  });
}

// Delete an individual purchase invoice and subtract from parent aggregates
export async function deleteIngredientPurchase(purchaseId: string, ingredientId: string) {
  const purchaseRef = doc(db, PURCHASES_COL, purchaseId);
  const purchaseSnap = await getDoc(purchaseRef);
  if (!purchaseSnap.exists()) return;
  const p = purchaseSnap.data() as IngredientPurchase;

  // 1. Delete invoice document
  await deleteDoc(purchaseRef);

  // 2. Subtract quantities from parent ingredient totals
  const ingRef = doc(db, INGREDIENTS_COL, ingredientId);
  const ingSnap = await getDoc(ingRef);
  if (ingSnap.exists()) {
    const data = ingSnap.data();
    await updateDoc(ingRef, {
      totalStock: Math.max(0, (data.totalStock || 0) - (p.quantity || 0)),
      totalSpent: Math.max(0, (data.totalSpent || 0) - (p.totalCost || 0)),
      purchaseCount: Math.max(0, (data.purchaseCount || 0) - 1),
      updatedAt: serverTimestamp()
    });
  }
}
