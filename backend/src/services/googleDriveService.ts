import { google } from "googleapis";
import fs from "fs";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,

    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },

  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({
  version: "v3",

  auth,
});

class GoogleDriveService {
  // ==========================================
  // CREATE FOLDER
  // ==========================================

  async createFolder(folderName: string, parentFolderId?: string) {
    const response = await drive.files.create({
      requestBody: {
        name: folderName,

        mimeType: "application/vnd.google-apps.folder",

        parents: parentFolderId ? [parentFolderId] : undefined,
      },

      fields: "id,name",
    });

    return response.data;
  }

  // ==========================================
  // FIND FOLDER
  // ==========================================

  async findFolder(folderName: string, parentFolderId: string) {
    const response = await drive.files.list({
      q: `
          name = '${folderName}'
          and '${parentFolderId}' in parents
          and mimeType = 'application/vnd.google-apps.folder'
          and trashed = false
        `,

      fields: "files(id,name)",

      spaces: "drive",
    });

    return response.data.files?.[0] || null;
  }

  // ==========================================
  // FIND OR CREATE FOLDER
  // ==========================================

  async findOrCreateFolder(folderName: string, parentFolderId: string) {
    const existingFolder = await this.findFolder(folderName, parentFolderId);

    if (existingFolder) {
      return existingFolder;
    }

    return await this.createFolder(folderName, parentFolderId);
  }

  // ==========================================
  // GET SHOT UNDER REVIEW FOLDER
  // ==========================================

async getShotUnderReviewFolder(
  projectName: string,
  shotNumber: number,
  version: number
) {

  const rootFolderId =
    process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  if (!rootFolderId) {
    throw new Error(
      "GOOGLE_DRIVE_ROOT_FOLDER_ID is missing"
    );
  }


  // Project folder
  const projectFolder =
    await this.findOrCreateFolder(
      projectName,
      rootFolderId
    );


  if (!projectFolder.id) {
    throw new Error(
      "Project folder ID not found"
    );
  }


  // Shot folder
  const shotFolder =
    await this.findOrCreateFolder(
      `Shot ${shotNumber}`,
      projectFolder.id
    );


  if (!shotFolder.id) {
    throw new Error(
      "Shot folder ID not found"
    );
  }


  // Under review
  const underReviewFolder =
    await this.findOrCreateFolder(
      "under_review",
      shotFolder.id
    );


  if (!underReviewFolder.id) {
    throw new Error(
      "Under review folder ID not found"
    );
  }


  // Version folder
  const versionFolder =
    await this.findOrCreateFolder(
      `v${version}`,
      underReviewFolder.id
    );


  if (!versionFolder.id) {
    throw new Error(
      "Version folder ID not found"
    );
  }


  return {

    underReviewFolderId:
      underReviewFolder.id,

    versionFolderId:
      versionFolder.id,

  };

}

  // ==========================================
  // UPLOAD FILE TO GOOGLE DRIVE
  // ==========================================

  async uploadFileToDrive(
    filePath: string,
    fileName: string,
    mimeType: string,
    parentFolderId: string,
  ) {
    const response = await drive.files.create({
      requestBody: {
        name: fileName,

        parents: [parentFolderId],
      },

      media: {
        mimeType,

        body: fs.createReadStream(filePath),
      },

      fields: "id,name,size,webViewLink",
    });

    return response.data;
  }

  // ==========================================
  // MOVE FILE
  // ==========================================

  async moveFile(fileId: string, newFolderId: string) {
    const file = await drive.files.get({
      fileId,

      fields: "parents",
    });

    const previousParents = file.data.parents?.join(",");

    const response = await drive.files.update({
      fileId,

      addParents: newFolderId,

      removeParents: previousParents,

      fields: "id,name,parents",
    });

    return response.data;
  }

  // ==========================================
  // UPDATE FOLDER
  // ==========================================

  async updateFolder(folderId: string, newFolderName: string) {
    const response = await drive.files.update({
      fileId: folderId,

      requestBody: {
        name: newFolderName,
      },

      fields: "id,name,parents",
    });

    return response.data;
  }

  // ==========================================
  // DELETE FILE
  // ==========================================

  async deleteFile(fileId: string) {
    await drive.files.delete({
      fileId,
    });

    return true;
  }

  // ==========================================
  // GET SHOT DESTINATION FOLDERS
  // ==========================================

  async getShotDestinationFolders(projectName: string, shotNumber: number) {
    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

    if (!rootFolderId) {
      throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is missing");
    }

    // ----------------------------------------
    // Project folder
    // ----------------------------------------

    const projectFolder = await this.findOrCreateFolder(
      projectName,
      rootFolderId,
    );

    if (!projectFolder.id) {
      throw new Error("Project folder ID not found");
    }

    // ----------------------------------------
    // Shot folder
    // ----------------------------------------

    const shotFolder = await this.findOrCreateFolder(
      `Shot ${shotNumber}`,
      projectFolder.id,
    );

    if (!shotFolder.id) {
      throw new Error("Shot folder ID not found");
    }

    // ----------------------------------------
    // Under review folder
    // ----------------------------------------

    const underReviewFolder = await this.findOrCreateFolder(
      "under_review",
      shotFolder.id,
    );

    // ----------------------------------------
    // Final video folder
    // ----------------------------------------

    const finalVideoFolder = await this.findOrCreateFolder(
      "finalVideo",
      shotFolder.id,
    );

    // ----------------------------------------
    // Project files folder
    // ----------------------------------------

    const projectFilesFolder = await this.findOrCreateFolder(
      "project files",
      shotFolder.id,
    );

    if (
      !underReviewFolder.id ||
      !finalVideoFolder.id ||
      !projectFilesFolder.id
    ) {
      throw new Error("Failed to create destination folders");
    }

    return {
      underReviewFolderId: underReviewFolder.id,

      finalVideoFolderId: finalVideoFolder.id,

      projectFilesFolderId: projectFilesFolder.id,
    };
  }

  // ==========================================
// RENAME FILE
// ==========================================

async renameFile(
  fileId: string,
  newFileName: string
) {

  const response =
    await drive.files.update({

      fileId,

      requestBody: {
        name: newFileName,
      },

      fields: "id,name,parents",

    });

  return response.data;
}

// ==========================================
// DELETE FOLDER
// ==========================================

async deleteFolder(
  folderId: string
) {

  await drive.files.delete({
    fileId: folderId,
  });

  return true;
}
}

export default new GoogleDriveService();
