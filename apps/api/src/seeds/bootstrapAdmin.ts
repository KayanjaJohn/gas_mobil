import "reflect-metadata";
import "dotenv/config";
import bcrypt from "bcryptjs";
import AppDataSource from "../config/database";
import { User } from "../entities/User";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be set for the one-time administrator bootstrap.`);
  return value;
}

async function bootstrapAdmin(): Promise<void> {
  const name = required("BOOTSTRAP_ADMIN_NAME");
  const email = required("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  const phone = required("BOOTSTRAP_ADMIN_PHONE");
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || "";

  if (password.length < 12) {
    throw new Error("BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters.");
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL must be a valid email address.");
  }

  try {
    await AppDataSource.initialize();
    const users = AppDataSource.getRepository(User);

    const adminCount = await users.count({ where: { role: "admin" } });
    if (adminCount > 0) {
      throw new Error("An administrator already exists. Bootstrap stopped without changing any data.");
    }

    const existing = await users.findOne({ where: [{ email }, { phone }] });
    if (existing) {
      throw new Error("The supplied email or phone is already in use. Bootstrap stopped without changing any data.");
    }

    const admin = users.create({
      name,
      email,
      phone,
      password: await bcrypt.hash(password, 12),
      role: "admin",
      isActive: true,
    });

    await users.save(admin);
    console.log(`Initial administrator created successfully for ${email}.`);
    console.log("Remove the temporary BOOTSTRAP_ADMIN_* environment variables now.");
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

bootstrapAdmin().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown bootstrap error";
  console.error("Administrator bootstrap failed:", message);
  process.exitCode = 1;
});
