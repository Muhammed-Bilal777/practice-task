import { Router } from "express";
import fileDeleter from "../controllers/deleteFile";
import fileUpdater from "../controllers/updateFile";
import fileUploader from "../controllers/fileUploader";
import findFiles from "../controllers/searchFiles";
import getFile from "../controllers/getFile";
import getFileByFilename from "../controllers/getFileByFilename";
import monitoringHealth from "../controllers/healthMonitoring";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const fileRouter = (router: Router): Router => {
  router
    .route("/binary")
    .post(upload.single("file"), fileUploader)
    .get(getFile)
    .put(upload.single("file"), fileUpdater)
    .delete(fileDeleter);

  router.route("/binary/files").get(findFiles);
  router.route("/health").get(monitoringHealth);
  router.route("/binary/files/:filename").get(getFileByFilename);
  return router;
};

export default fileRouter;
