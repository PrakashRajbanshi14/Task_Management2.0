import bcrypt from "bcryptjs";
import { envConfig } from "../config/config";
import "../database/connection";
import { UserRole } from "../globals/types";
import User from "../database/models/userModel";

const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({
      where: {
        role: UserRole.Admin,
      },
    });

    if (existingAdmin) {
      console.log("Super Admin already exists!");

      process.exit(0);
    }

    const password = envConfig.adminPass;

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      userName: envConfig.adminUsername,
      email: envConfig.adminEmail,
      password: hashedPassword,
      googleId: null,
      fullName: "Super Admin",
      profileImage: null,
      role: UserRole.Admin,
      isActive: true,
    });

    console.log("Super Admin created successfully!");

    console.log({
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    process.exit(0);
  } catch (error) {
    console.error("Error creating Super Admin:", error);

    process.exit(1);
  }
};

seedAdmin();
