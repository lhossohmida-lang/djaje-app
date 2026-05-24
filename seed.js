const admin = require("firebase-admin");

// ─── CONFIG ────────────────────────────────────────────────────────────────
// Put your serviceAccountKey.json in the project root, then run:
//   node seed.js
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

// ─── ADMIN USER ─────────────────────────────────────────────────────────────
const adminUser = {
  email: "admin@doudou.com",
  password: "Admin@12345",
  fullName: "Restaurant Owner",
};

// ─── MENU ITEMS ──────────────────────────────────────────────────────────────
const menuItems = [
  {
    id: "meal-1",
    name: "دجاج مشوي فاخر",
    description: "نصف دجاجة مشوية مع صلصة خاصة وبطاطا متبلة.",
    category: "مشاوي",
    price: 950,
    imageUrl:
      "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1200&q=80",
    available: true,
    prepTime: 25,
  },
  {
    id: "meal-2",
    name: "برغر الدجاج المقرمش",
    description: "خبز طازج، دجاج مقرمش، خس، جبنة، وصلصة خاصة.",
    category: "ساندويتش",
    price: 650,
    imageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
    available: true,
    prepTime: 18,
  },
  {
    id: "meal-3",
    name: "بيتزا الدجاج الحار",
    description: "بيتزا رقيقة مع دجاج متبل، فلفل، وزيتون.",
    category: "بيتزا",
    price: 1200,
    imageUrl:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
    available: true,
    prepTime: 30,
  },
  {
    id: "meal-4",
    name: "سلطة سيزر بالدجاج",
    description: "خيار خفيف وصحي مع جبنة بارميزان وصوص سيزر.",
    category: "سلطات",
    price: 700,
    imageUrl:
      "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1200&q=80",
    available: true,
    prepTime: 12,
  },
];

// ─── SEED FUNCTIONS ──────────────────────────────────────────────────────────
async function seedAdmin() {
  console.log("\n📌 Creating admin account...");
  try {
    const userRecord = await auth.createUser({
      email: adminUser.email,
      password: adminUser.password,
      displayName: adminUser.fullName,
    });

    await auth.setCustomUserClaims(userRecord.uid, { admin: true });

    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      fullName: adminUser.fullName,
      email: adminUser.email,
      role: "admin",
    });

    console.log(`✅ Admin created: ${adminUser.email} (uid: ${userRecord.uid})`);
    console.log(`   Password: ${adminUser.password}`);
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      console.log(`⚠️  Admin already exists: ${adminUser.email}`);
    } else {
      console.error("❌ Failed to create admin:", err.message);
    }
  }
}

async function seedMenu() {
  console.log("\n📌 Seeding menu items...");
  const batch = db.batch();

  for (const item of menuItems) {
    const ref = db.collection("menuItems").doc(item.id);
    batch.set(ref, item);
  }

  await batch.commit();
  console.log(`✅ ${menuItems.length} menu items seeded.`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Starting seed...");
  await seedAdmin();
  await seedMenu();
  console.log("\n✅ Seed complete!\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
