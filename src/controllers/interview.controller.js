import crypto from 'crypto';
import { uploadToS3 } from '../utils/uploadToS3.js';
import InterviewSession from '../models/interviewsession.model.js';
function getSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

const startInterview = async (req, res) => {
  try {
    const { category, subcategory, level } = req.body;
    const sessionId = getSessionId();
    // Check if resume file is uploaded
    let resumeFile = null;
    let resumeUrl = "";
    if (req.files && req.files.resume && req.files.resume[0]) {
      resumeFile = req.files.resume[0]; // contains buffer, mimetype, etc.
      //here upload to aws
      resumeUrl= await uploadToS3(resumeFile.path ,"Resumes");
    }


    // Example payload you might send to AI/interview service
    const payload = {
      sessionId,
      category,
      subcategory, 
      level,
      resume: resumeUrl || "", // or save file path in DB
    };

     const newSession=await InterviewSession.create(payload);



    //TODO fullfill this request and here call a function which will handle the interview process through the socket connection like sending and receiving messages.
      

    //TODO indenfidy user if logged in and save this data in there database

    // Handle based on resume presence
    // if (resumeFile) {
    //   console.log("📄 Resume uploaded:", resumeFile.originalname);
    //   // Save to DB / cloud storage if needed
    // } else {
    //   console.log("ℹ️ No resume uploaded. Personal/General interview mode.");
    // }

    // Send success response
    res.status(200).json({
      success: true,
      message: "Interview initialized successfully",
      data: newSession,
    });
  } catch (error) {
    console.error("Error starting interview:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



export {
    startInterview
}