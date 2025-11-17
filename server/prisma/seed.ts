import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Create Super Admin
  const adminEmail = "admin@gmail.com";
  const adminPassword = "123456";
  const adminName = "Super Admin";

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (!existingSuperAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const superAdminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: "SUPER_ADMIN",
      },
    });
    console.log("✅ Super admin created:", superAdminUser.email);
  } else {
    console.log("ℹ️  Super admin already exists");
  }

  // 2. Create Sample User
  const userEmail = "user@example.com";
  const userPassword = "123456";
  let regularUser = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!regularUser) {
    const hashedPassword = await bcrypt.hash(userPassword, 10);
    regularUser = await prisma.user.create({
      data: {
        email: userEmail,
        name: "John Doe",
        password: hashedPassword,
        role: "USER",
      },
    });
    console.log("✅ Sample user created:", regularUser.email);
  } else {
    console.log("ℹ️  Sample user already exists");
  }

  // 2.1. Create Addresses for Sample User
  if (regularUser) {
    const existingAddresses = await prisma.address.count({
      where: { userId: regularUser.id },
    });

    if (existingAddresses === 0) {
      const addresses = [
        {
          userId: regularUser.id,
          name: "John Doe",
          address: "123 Main Street, Apartment 4B",
          city: "New York",
          country: "United States",
          postalCode: "10001",
          phone: "+1-555-0123",
          isDefault: true,
        },
        {
          userId: regularUser.id,
          name: "John Doe",
          address: "456 Oak Avenue, Suite 200",
          city: "Los Angeles",
          country: "United States",
          postalCode: "90001",
          phone: "+1-555-0456",
          isDefault: false,
        },
      ];

      for (const address of addresses) {
        await prisma.address.create({
          data: address,
        });
      }
      console.log(`✅ Created ${addresses.length} addresses for sample user`);
    } else {
      console.log(`ℹ️  ${existingAddresses} addresses already exist for sample user`);
    }
  }

  // 3. Create Sample Products
  const existingProducts = await prisma.product.count();
  if (existingProducts === 0) {
    const products = [
      {
        name: "Classic White T-Shirt",
        brand: "Nike",
        description: "Comfortable and stylish white t-shirt made from premium cotton. Perfect for everyday wear.",
        category: "Fashion",
        gender: "Unisex",
        sizes: ["S", "M", "L", "XL"],
        colors: ["White", "Navy", "Blue"],
        price: 29.99,
        stock: 50,
        soldCount: 0,
        rating: 4.5,
        images: [
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
          "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500",
        ],
        isFeatured: true,
      },
      {
        name: "Running Shoes Pro",
        brand: "Adidas",
        description: "High-performance running shoes with advanced cushioning technology. Perfect for athletes.",
        category: "Shoes",
        gender: "Unisex",
        sizes: ["7", "8", "9", "10", "11", "12"],
        colors: ["Navy", "White", "Orange"],
        price: 129.99,
        stock: 30,
        soldCount: 0,
        rating: 4.8,
        images: [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
          "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500",
        ],
        isFeatured: true,
      },
      {
        name: "Leather Wallet Classic",
        brand: "Puma",
        description: "Premium leather wallet with multiple card slots and cash compartment. Durable and elegant.",
        category: "Wallet",
        gender: "Unisex",
        sizes: ["One Size"],
        colors: ["Navy", "Brown", "Black"],
        price: 49.99,
        stock: 40,
        soldCount: 0,
        rating: 4.3,
        images: [
          "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500",
        ],
        isFeatured: false,
      },
      {
        name: "Designer Handbag",
        brand: "Nike",
        description: "Stylish handbag with spacious interior. Perfect for daily use and special occasions.",
        category: "Hand Bag",
        gender: "Women",
        sizes: ["One Size"],
        colors: ["Navy", "Pink", "White"],
        price: 79.99,
        stock: 25,
        soldCount: 0,
        rating: 4.6,
        images: [
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
        ],
        isFeatured: true,
      },
      {
        name: "Aviator Sunglasses",
        brand: "Reebok",
        description: "Classic aviator style sunglasses with UV protection. Timeless design for all occasions.",
        category: "Sunglass",
        gender: "Unisex",
        sizes: ["One Size"],
        colors: ["Navy", "Black", "Blue"],
        price: 39.99,
        stock: 60,
        soldCount: 0,
        rating: 4.4,
        images: [
          "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500",
        ],
        isFeatured: false,
      },
      {
        name: "Baseball Cap Premium",
        brand: "Under Armour",
        description: "Comfortable baseball cap with adjustable strap. Perfect for outdoor activities.",
        category: "Cap",
        gender: "Unisex",
        sizes: ["One Size"],
        colors: ["Navy", "White", "Green", "Orange"],
        price: 24.99,
        stock: 80,
        soldCount: 0,
        rating: 4.2,
        images: [
          "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500",
        ],
        isFeatured: false,
      },
      {
        name: "Smart Watch Series 5",
        brand: "Nike",
        description: "Feature-rich smartwatch with fitness tracking, heart rate monitor, and smartphone connectivity.",
        category: "Electronics",
        gender: "Unisex",
        sizes: ["Small", "Medium", "Large"],
        colors: ["Black", "Navy", "Pink"],
        price: 199.99,
        stock: 20,
        soldCount: 0,
        rating: 4.7,
        images: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
        ],
        isFeatured: true,
      },
      {
        name: "Denim Jacket Classic",
        brand: "Adidas",
        description: "Classic denim jacket with a modern fit. Versatile piece for any wardrobe.",
        category: "Fashion",
        gender: "Unisex",
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["Navy", "Blue"],
        price: 89.99,
        stock: 35,
        soldCount: 0,
        rating: 4.5,
        images: [
          "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
        ],
        isFeatured: false,
      },
    ];

    for (const product of products) {
      await prisma.product.create({
        data: product,
      });
    }
    console.log(`✅ Created ${products.length} sample products`);
  } else {
    console.log(`ℹ️  ${existingProducts} products already exist`);
  }

  // 4. Create Sample Coupons
  const existingCoupons = await prisma.coupon.count();
  if (existingCoupons === 0) {
    const coupons = [
      {
        code: "WELCOME10",
        discountPercent: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        usageLimit: 100,
        usageCount: 0,
      },
      {
        code: "SUMMER25",
        discountPercent: 25,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        usageLimit: 50,
        usageCount: 0,
      },
      {
        code: "FLASH50",
        discountPercent: 50,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        usageLimit: 20,
        usageCount: 0,
      },
    ];

    for (const coupon of coupons) {
      await prisma.coupon.create({
        data: coupon,
      });
    }
    console.log(`✅ Created ${coupons.length} sample coupons`);
  } else {
    console.log(`ℹ️  ${existingCoupons} coupons already exist`);
  }

  // 5. Create Feature Banners
  const existingBanners = await prisma.featureBanner.count();
  if (existingBanners === 0) {
    const banners = [
      {
        imageUrl: "/images/banner.webp",
      },
      {
        imageUrl: "/images/banner2.jpg",
      },
    ];

    for (const banner of banners) {
      await prisma.featureBanner.create({
        data: banner,
      });
    }
    console.log(`✅ Created ${banners.length} feature banners`);
  } else {
    console.log(`ℹ️  ${existingBanners} banners already exist`);
  }

  console.log("🎉 Database seeding completed successfully!");
  console.log("\n📝 Login Credentials:");
  console.log("   Admin: admin@gmail.com / 123456");
  console.log("   User:  user@example.com / 123456");
  console.log("\n🎫 Sample Coupon Codes:");
  console.log("   WELCOME10 - 10% off");
  console.log("   SUMMER25 - 25% off");
  console.log("   FLASH50 - 50% off");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
