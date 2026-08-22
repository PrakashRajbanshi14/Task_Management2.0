import { google } from "googleapis";
import fs from "fs";


// =====================================================
// GOOGLE DRIVE AUTHENTICATION
// =====================================================

const auth = new google.auth.GoogleAuth({

  credentials: {

    client_email:
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,

    private_key:
      process.env.GOOGLE_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n",
      ),

  },

  scopes: [
    "https://www.googleapis.com/auth/drive",
  ],

});


const drive = google.drive({

  version: "v3",

  auth,

});


// =====================================================
// GOOGLE DRIVE SERVICE
// =====================================================

class GoogleDriveService {


  // ===================================================
  // CREATE FOLDER
  // ===================================================

  async createFolder(
    folderName: string,
    parentFolderId?: string,
  ) {

    const response =
      await drive.files.create({

        requestBody: {

          name: folderName,

          mimeType:
            "application/vnd.google-apps.folder",

          parents:
            parentFolderId
              ? [parentFolderId]
              : undefined,

        },

        fields:
          "id,name,parents",

      });


    return response.data;
  }


  // ===================================================
  // FIND FOLDER
  // ===================================================

  async findFolder(
    folderName: string,
    parentFolderId: string,
  ) {

    // Escape single quotes for Drive query
    const escapedFolderName =
      folderName.replace(
        /'/g,
        "\\'",
      );


    const response =
      await drive.files.list({

        q: `
          name = '${escapedFolderName}'
          and '${parentFolderId}' in parents
          and mimeType = 'application/vnd.google-apps.folder'
          and trashed = false
        `,

        fields:
          "files(id,name,parents)",

        spaces:
          "drive",

      });


    return (
      response.data.files?.[0]
      ?? null
    );
  }


  // ===================================================
  // FIND OR CREATE FOLDER
  // ===================================================

  async findOrCreateFolder(
    folderName: string,
    parentFolderId: string,
  ) {

    const existingFolder =
      await this.findFolder(
        folderName,
        parentFolderId,
      );


    if (existingFolder) {

      return existingFolder;

    }


    return await this.createFolder(
      folderName,
      parentFolderId,
    );
  }


  // ===================================================
  // GET SHOT UNDER REVIEW VERSION FOLDER
  // ===================================================

  /*
  
  Creates:

  Project
      └── Shot 1
          └── under_review
              └── v1

  On next submission:

  Project
      └── Shot 1
          └── under_review
              ├── v1
              └── v2

  */

  async getShotUnderReviewFolder(
    projectName: string,
    shotNumber: number,
    version: number,
  ) {

    const rootFolderId =
      process.env
        .GOOGLE_DRIVE_ROOT_FOLDER_ID;


    if (!rootFolderId) {

      throw new Error(
        "GOOGLE_DRIVE_ROOT_FOLDER_ID is missing",
      );

    }


    // -----------------------------------------------
    // PROJECT FOLDER
    // -----------------------------------------------

    const projectFolder =
      await this.findOrCreateFolder(
        projectName,
        rootFolderId,
      );


    if (!projectFolder.id) {

      throw new Error(
        "Project folder ID not found",
      );

    }


    // -----------------------------------------------
    // SHOT FOLDER
    // -----------------------------------------------

    const shotFolder =
      await this.findOrCreateFolder(
        `Shot ${shotNumber}`,
        projectFolder.id,
      );


    if (!shotFolder.id) {

      throw new Error(
        "Shot folder ID not found",
      );

    }


    // -----------------------------------------------
    // UNDER REVIEW FOLDER
    // -----------------------------------------------

    const underReviewFolder =
      await this.findOrCreateFolder(
        "under_review",
        shotFolder.id,
      );


    if (!underReviewFolder.id) {

      throw new Error(
        "Under review folder ID not found",
      );

    }


    // -----------------------------------------------
    // VERSION FOLDER
    // -----------------------------------------------

    const versionFolder =
      await this.findOrCreateFolder(
        `v${version}`,
        underReviewFolder.id,
      );


    if (!versionFolder.id) {

      throw new Error(
        "Version folder ID not found",
      );

    }


    return {

      underReviewFolderId:
        underReviewFolder.id,

      versionFolderId:
        versionFolder.id,

    };

  }


  // ===================================================
  // UPLOAD FILE TO GOOGLE DRIVE
  // ===================================================

  async uploadFileToDrive(

    filePath: string,

    fileName: string,

    mimeType: string,

    parentFolderId: string,

  ) {

    const response =
      await drive.files.create({

        requestBody: {

          name: fileName,

          parents: [
            parentFolderId,
          ],

        },

        media: {

          mimeType,

          body:
            fs.createReadStream(
              filePath,
            ),

        },

        fields:
          "id,name,size,webViewLink,parents",

      });


    return response.data;
  }


  // ===================================================
  // GET FILE INFORMATION
  // ===================================================

  async getFile(
    fileId: string,
  ) {

    const response =
      await drive.files.get({

        fileId,

        fields:
          "id,name,size,mimeType,parents,webViewLink",

      });


    return response.data;
  }


  // ===================================================
  // MOVE FILE
  // ===================================================

  async moveFile(
    fileId: string,
    newFolderId: string,
  ) {

    const file =
      await drive.files.get({

        fileId,

        fields:
          "parents",

      });


    const previousParents =
      file.data.parents?.join(",");


    const response =
      await drive.files.update({

        fileId,

        addParents:
          newFolderId,

        removeParents:
          previousParents || undefined,

        fields:
          "id,name,parents,webViewLink",

      });


    return response.data;
  }


  // ===================================================
  // RENAME FILE
  // ===================================================

  async renameFile(
    fileId: string,
    newFileName: string,
  ) {

    const response =
      await drive.files.update({

        fileId,

        requestBody: {

          name: newFileName,

        },

        fields:
          "id,name,parents,webViewLink",

      });


    return response.data;
  }


  // ===================================================
  // MOVE + RENAME FILE
  // ===================================================

  /*
  
  Example:

  Before:

  under_review
      └── v1
          └── v1_final.mp4

  After:

  finalVideo
      └── final.mp4

  */

  async moveAndRenameFile(

    fileId: string,

    newFolderId: string,

    originalFileName: string,

  ) {

    // -----------------------------------------------
    // MOVE
    // -----------------------------------------------

    await this.moveFile(
      fileId,
      newFolderId,
    );


    // -----------------------------------------------
    // REMOVE VERSION PREFIX
    // -----------------------------------------------

    await this.renameFile(
      fileId,
      originalFileName,
    );


    return true;
  }


  // ===================================================
  // UPDATE FOLDER NAME
  // ===================================================

  async updateFolder(
    folderId: string,
    newFolderName: string,
  ) {

    const response =
      await drive.files.update({

        fileId: folderId,

        requestBody: {

          name:
            newFolderName,

        },

        fields:
          "id,name,parents",

      });


    return response.data;
  }


  // ===================================================
  // DELETE FILE
  // ===================================================

  async deleteFile(
    fileId: string,
  ) {

    await drive.files.delete({

      fileId,

    });


    return true;
  }


  // ===================================================
  // DELETE FOLDER
  // ===================================================

  async deleteFolder(
    folderId: string,
  ) {

    await drive.files.delete({

      fileId: folderId,

    });


    return true;
  }


  // ===================================================
  // GET SHOT DESTINATION FOLDERS
  // ===================================================

  /*
  
  Returns:

  Project
      └── Shot 1
          ├── under_review
          ├── finalVideo
          └── project files

  */

  async getShotDestinationFolders(

    projectName: string,

    shotNumber: number,

  ) {

    const rootFolderId =
      process.env
        .GOOGLE_DRIVE_ROOT_FOLDER_ID;


    if (!rootFolderId) {

      throw new Error(
        "GOOGLE_DRIVE_ROOT_FOLDER_ID is missing",
      );

    }


    // -----------------------------------------------
    // PROJECT FOLDER
    // -----------------------------------------------

    const projectFolder =
      await this.findOrCreateFolder(
        projectName,
        rootFolderId,
      );


    if (!projectFolder.id) {

      throw new Error(
        "Project folder ID not found",
      );

    }


    // -----------------------------------------------
    // SHOT FOLDER
    // -----------------------------------------------

    const shotFolder =
      await this.findOrCreateFolder(
        `Shot ${shotNumber}`,
        projectFolder.id,
      );


    if (!shotFolder.id) {

      throw new Error(
        "Shot folder ID not found",
      );

    }


    // -----------------------------------------------
    // UNDER REVIEW
    // -----------------------------------------------

    const underReviewFolder =
      await this.findOrCreateFolder(
        "under_review",
        shotFolder.id,
      );


    // -----------------------------------------------
    // FINAL VIDEO
    // -----------------------------------------------

    const finalVideoFolder =
      await this.findOrCreateFolder(
        "finalVideo",
        shotFolder.id,
      );


    // -----------------------------------------------
    // PROJECT FILES
    // -----------------------------------------------

    const projectFilesFolder =
      await this.findOrCreateFolder(
        "project files",
        shotFolder.id,
      );


    if (

      !underReviewFolder.id ||

      !finalVideoFolder.id ||

      !projectFilesFolder.id

    ) {

      throw new Error(
        "Failed to create destination folders",
      );

    }


    return {

      underReviewFolderId:
        underReviewFolder.id,

      finalVideoFolderId:
        finalVideoFolder.id,

      projectFilesFolderId:
        projectFilesFolder.id,

    };

  }


  // ===================================================
  // REMOVE VERSION PREFIX
  // ===================================================

  /*
  
  v1_video.mp4
       ↓
  video.mp4

  v2_project.zip
       ↓
  project.zip

  */

  removeVersionPrefix(
    fileName: string,
  ) {

    return fileName.replace(
      /^v\d+_/,
      "",
    );

  }


}


// =====================================================
// EXPORT SINGLE INSTANCE
// =====================================================

export default new GoogleDriveService();