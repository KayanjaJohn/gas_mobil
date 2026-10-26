
import "dotenv/config";
import AppDataSource from "../config/database";
import { Station } from "../entities/Station";
import { User } from "../entities/User";
import { Product } from "../entities/Product";
import bcrypt from "bcryptjs";

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value || value.length < 12) {
    throw new Error(`${name} must be configured and at least 12 characters long.`);
  }
  return value;
};

async function bootstrapDemo() {
  const adminPassword = required("BOOTSTRAP_ADMIN_PASSWORD");
  const agentPassword = required("BOOTSTRAP_AGENT_PASSWORD");
  const driverPassword = required("BOOTSTRAP_DRIVER_PASSWORD");

  await AppDataSource.initialize();

  try {
    const stationRepo = AppDataSource.getRepository(Station);
    const userRepo = AppDataSource.getRepository(User);
    const productRepo = AppDataSource.getRepository(Product);

    let station = await stationRepo.findOne({
      where: { name: "Kampala Central Station" },
    });

    if (!station) {
      station = stationRepo.create({
        name: "Kampala Central Station",
        address: "Kampala Road, Kampala, Uganda",
        latitude: 0.3476,
        longitude: 32.5825,
        phone: "+256700000001",
        email: "kampala@gasmobil.com",
        isActive: true,
      });
      station = await stationRepo.save(station);
      console.log("Created demo station.");
    } else {
      console.log("Reusing existing station.");
    }

    const accounts = [
      {
        name: "GasMobil Administrator",
        email: "admin@gasmobil.com",
        phone: "+256700000000",
        role: "admin" as const,
        password: adminPassword,
      },
      {
        name: "Demo Station Agent",
        email: "agent@gasmobil.com",
        phone: "+256700000002",
        role: "agent" as const,
        password: agentPassword,
      },
      {
        name: "Demo Delivery Driver",
        email: "driver@gasmobil.com",
        phone: "+256700000003",
        role: "driver" as const,
        password: driverPassword,
      },
    ];

    for (const account of accounts) {
      const existing = await userRepo.findOne({
        where: { email: account.email },
      });

      if (existing) {
        if (existing.role !== account.role) {
          throw new Error(
            `Account ${account.email} already exists with a different role.`
          );
        }
        console.log(`Reusing existing ${account.role} account.`);
        continue;
      }

      const user = userRepo.create({
        name: account.name,
        email: account.email,
        phone: account.phone,
        password: await bcrypt.hash(account.password, 12),
        role: account.role,
        isActive: true,
        stationId: account.role === "admin" ? null : station.id,
        ...(account.role === "driver"
          ? {
              driverStatus: "offline" as const,
              vehicleType: "Motorcycle",
            }
          : {}),
      });

      await userRepo.save(user);
      console.log(`Created ${account.role} account.`);
    }

    const products = [
      {
        name: "6kg Gas Cylinder",
        description: "Standard 6kg LPG cylinder",
        price: 85000,
        stock: 50,
        weight: 6,
        size: "6kg",
        type: "cylinder" as const,
      },
      {
        name: "12kg Gas Cylinder",
        description: "12kg LPG cylinder",
        price: 150000,
        stock: 30,
        weight: 12,
        size: "12kg",
        type: "cylinder" as const,
      },
      {
        name: "Gas Regulator",
        description: "Gas cylinder regulator",
        price: 25000,
        stock: 100,
        type: "accessory" as const,
      },
      {
        name: "Gas Hose (2m)",
        description: "Reinforced gas hose",
        price: 15000,
        stock: 80,
        type: "accessory" as const,
      },
    ];

    for (const item of products) {
      const existing = await productRepo.findOne({
        where: { name: item.name, stationId: station.id },
      });

      if (existing) {
        console.log(`Reusing product: ${item.name}`);
        continue;
      }

      await productRepo.save(
        productRepo.create({
          ...item,
          stationId: station.id,
          isAvailable: true,
        })
      );
      console.log(`Created product: ${item.name}`);
    }

    console.log("Demo bootstrap completed.");
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

bootstrapDemo().catch((error) => {
  console.error("Demo bootstrap failed:", error.message);
  process.exitCode = 1;
});
