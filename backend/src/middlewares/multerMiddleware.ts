import multer from "multer";
import path from "path";
import fs from "fs";


const uploadDirectory =
  path.join(
    process.cwd(),
    "uploads"
  );


// Create uploads folder if it doesn't exist
if (!fs.existsSync(uploadDirectory)) {

  fs.mkdirSync(
    uploadDirectory,
    {
      recursive: true,
    }
  );

}


const storage =
  multer.diskStorage({

    destination: (
      req,
      file,
      cb
    ) => {

      cb(
        null,
        uploadDirectory
      );

    },


    filename: (
      req,
      file,
      cb
    ) => {

      const uniqueName =
        `${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}-${file.originalname}`;

      cb(
        null,
        uniqueName
      );

    },

  });


const upload =
  multer({

    storage,

    limits: {

      // Adjust according to your requirements
      fileSize:
        5 * 1024 * 1024 * 1024,

      files: 11,

    },

  });


export default upload;