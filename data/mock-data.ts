import { MenuItem } from "@/types";

export const sampleMenu: MenuItem[] = [
  {
    id: "meal-1",
    name: "دجاج مشوي فاخر",
    description: "نصف دجاجة مشوية مع صلصة خاصة وبطاطا متبلة.",
    category: "مشاوي",
    price: 950,
    imageUrl:
      "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1200&q=80",
    available: true,
    prepTime: 25
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
    prepTime: 18
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
    prepTime: 30
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
    prepTime: 12
  }
];
