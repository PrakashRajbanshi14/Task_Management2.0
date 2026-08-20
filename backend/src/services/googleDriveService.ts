import { google } from "googleapis";

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

  async deleteFile(fileId: string) {
    await drive.files.delete({
      fileId,
    });

    return true;
  }
}

export default new GoogleDriveService();
