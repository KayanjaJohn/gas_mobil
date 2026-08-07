import AppDataSource from "../config/database";
import { ProductCatalog } from "../entities/ProductCatalog";

const seedCatalog = async () => {
  const catalogRepo = AppDataSource.getRepository(ProductCatalog);

  const templates = [
    // ── Gas Cylinders ──
    {
      name: "6kg Gas Cylinder",
      description: "Compact 6kg gas cylinder perfect for small households and single-burner setups. Deposit-free swap available.",
      defaultPrice: 157000,
      defaultWeight: 6,
      defaultSize: "6kg",
      category: "cylinder" as const,
      imageUrl: null,
      isActive: true,
    },
    {
      name: "12kg Gas Cylinder",
      description: "Standard 12kg gas cylinder — the most popular choice for families. Swap your empty for a full one in 2 hours.",
      defaultPrice: 270000,
      defaultWeight: 12,
      defaultSize: "12kg",
      category: "cylinder" as const,
      imageUrl: null,
      isActive: true,
    },
    {
      name: "45kg Gas Cylinder",
      description: "Industrial-grade 45kg gas cylinder for restaurants, hotels, and commercial kitchens.",
      defaultPrice: 525000,
      defaultWeight: 45,
      defaultSize: "45kg",
      category: "cylinder" as const,
      imageUrl: null,
      isActive: true,
    },
    // ── Burners ──
    {
      name: "Single Gas Burner",
      description: "Stainless steel single burner stove for everyday cooking. Durable and energy-efficient.",
      defaultPrice: 35000,
      defaultWeight: null,
      defaultSize: null,
      category: "accessory" as const,
      imageUrl: null,
      isActive: true,
    },
    {
      name: "Double Gas Burner",
      description: "Heavy-duty double burner stove for large households. Independent flame control.",
      defaultPrice: 65000,
      defaultWeight: null,
      defaultSize: null,
      category: "accessory" as const,
      imageUrl: null,
      isActive: true,
    },
    {
      name: "Commercial Gas Burner",
      description: "Industrial-grade burner for restaurants and hotels. High-BTU output for fast cooking.",
      defaultPrice: 180000,
      defaultWeight: null,
      defaultSize: null,
      category: "accessory" as const,
      imageUrl: null,
      isActive: true,
    },
    // ── Grills ──
    {
      name: "Portable Gas Grill",
      description: "Compact outdoor gas grill for barbecue and grilling. Perfect for picnics and camping.",
      defaultPrice: 120000,
      defaultWeight: null,
      defaultSize: null,
      category: "accessory" as const,
      imageUrl: null,
      isActive: true,
    },
    {
      name: "Tabletop Gas Grill",
      description: "Small tabletop grill perfect for balconies and small patios. Easy to clean.",
      defaultPrice: 85000,
      defaultWeight: null,
      defaultSize: null,
      category: "accessory" as const,
      imageUrl: null,
      isActive: true,
    },
    // ── Regulators ──
    {
      name: "Standard Gas Regulator",
      description: "Brass pressure regulator for standard home gas setups. Fits 6kg and 12kg cylinders.",
      defaultPrice: 25000,
      defaultWeight: null,
      defaultSize: null,
      category: "accessory" as const,
      imageUrl: null,
      isActive: true,
    },
    {
      name: "Low-Pressure Regulator",
      description: "Precision low-pressure regulator with gauge. Ideal for sensitive appliances.",
      defaultPrice: 35000,
      defaultWeight: null,
      defaultSize: null,
      category: "accessory" as const,
      imageUrl: null,
      isActive: true,
    },
    {
      name: "Commercial Regulator",
      description: "Heavy-duty regulator designed for 45kg commercial cylinders. High flow rate.",
      defaultPrice: 55000,
      defaultWeight: null,
      defaultSize: null,
      category: "accessory" as const,
      imageUrl: null,
      isActive: true,
    },
    // ── Hosepipes ──
    {
      name: "Gas Hosepipe 1.5m",
      description: "High-quality reinforced rubber gas hose, 1.5 meters. Includes two clamps.",
      defaultPrice: 15000,
      defaultWeight: null,
      defaultSize: "1.5m",
      category: "accessory" as const,
      imageUrl: null,
      isActive: true,
    },
    {
      name: "Gas Hosepipe 2m",
      description: "Premium reinforced gas hose, 2 meters long. Includes clamps and leak-proof fittings.",
      defaultPrice: 20000,
      defaultWeight: null,
      defaultSize: "2m",
      category: "accessory" as const,
      imageUrl: null,
      isActive: true,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const item of templates) {
    const existing = await catalogRepo.findOne({
      where: { name: item.name },
    });
    if (existing) {
      skipped++;
      continue;
    }
    const catalogItem = catalogRepo.create(item);
    await catalogRepo.save(catalogItem);
    created++;
  }

  console.log(`[Seed] Catalog: ${created} created, ${skipped} skipped (already exist)`);
};

export default seedCatalog;

// Run standalone: npx ts-node src/seeds/catalogSeed.ts
if (require.main === module) {
  AppDataSource.initialize()
    .then(async () => {
      await seedCatalog();
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Seed] Failed:", err);
      process.exit(1);
    });
}
