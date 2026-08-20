import { config } from "dotenv"
config()

const connectionString = process.env.DB_URI || process.env.DATABASE_URL

export const envConfig = {
    connectionString,
    port : process.env.PORT,
    clientUrl : process.env.FRONTEND_URL,

    jwtAccessSecretKey : process.env.JWT_ACCESS_SECRET as string,
    jwtRefreshSecretKey : process.env.JWT_REFRESH_SECRET as string,
    accessSecretExpiresIn : process.env.ACCESS_TOKEN_EXPIRES_IN ,
    refreshSecretExpiresIn : process.env.REFRESH_TOKEN_EXPIRES_IN,

    adminUsername: process.env.ADMIN_USERNAME as string,
    adminEmail: process.env.ADMIN_EMAIL as string,
    adminPass: process.env.ADMIN_PASS as string,
    projectManagerUsername: process.env.PROJECT_MANAGER_USERNAME as string,
    projectManagerEmail: process.env.PROJECT_MANAGER_EMAIL as string,
    projectManagerPass: process.env.PROJECT_MANAGER_PASS as string,

    googleClientId: process.env.GOOGLE_CLIENT_ID as string | undefined,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET as string | undefined,
    googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL as string | undefined,

    //for google drive api
    googleServiceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL as string | undefined,
    googlePrivateKey: process.env.GOOGLE_PRIVATE_KEY as string | undefined,
    googleDriveRootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID as string | undefined
}