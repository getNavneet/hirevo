import express from 'express';
import { startInterview } from '../controllers/interview.controller.js';

import { upload } from '../middlewares/multer.middleware.js';
const router = express.Router();


router.route("/interview/start").post(
  upload.fields([
    {
      name: "resume", // PDF resume (optional)
      maxCount: 1,
    },
  ]),
  startInterview
);





export default router;
