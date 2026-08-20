import bcrypt from "bcryptjs";

import "../database/connection";
import User from "../database/models/userModel";
import { UserRole } from "../globals/types";
import { envConfig } from "../config/config";

const seedProjectManager = async () => {
  try {
    const existingProjectManager = await User.findOne({
      where: {
        email: envConfig.projectManagerEmail,
      },
    });

    if (existingProjectManager) {
      console.log("Project Manager already exists!");

      process.exit(0);
    }

    const password = envConfig.projectManagerPass;

    const hashedPassword = await bcrypt.hash(password, 10);

    const projectManager = await User.create({
      userName: envConfig.projectManagerUsername,

      email: envConfig.projectManagerEmail,

      password: hashedPassword,

      googleId: null,

      fullName: "Project Manager",

      phone: null,

      profileImage: null,

      role: UserRole.ProjectManager,

      isActive: true,
    });

    console.log("Project Manager created successfully!");

    console.log({
      id: projectManager.id,

      email: projectManager.email,

      role: projectManager.role,
    });

    process.exit(0);
  } catch (error) {
    console.error("Error creating Project Manager:", error);

    process.exit(1);
  }
};

seedProjectManager();
