const startInterview = async (req, res) => {
  try {
    const { category, subcategory, level } = req.body;

    // Check if resume file is uploaded
    let resumeFile = null;
    if (req.files && req.files.resume && req.files.resume[0]) {
      resumeFile = req.files.resume[0]; // contains buffer, mimetype, etc.
    }


    // Example payload you might send to AI/interview service
    const payload = {
      category,
      subcategory, 
      level,
      resume: resumeFile ? resumeFile.originalname : null, // or save file path in DB
    };

     // check for category type
     if (category === "core" || category === "programming" ) {
      console.log("Core category selected");
      const payload = {
      category,
      subcategory, 
      level
    };
    } else if (category === "personal") {
      console.log("personal category selected");
       const payload = {
      category,
      level
    };
    } else if(category === "resume"){
      console.log("Invalid category selected");
      const payload = {
      category,
      level,
      resume: resumeFile ? resumeFile.originalname : null, // or save file path in DB
    };
    }
    else {
      console.log("Invalid category selected");
    }


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
      data: payload,
    });
  } catch (error) {
    console.error("Error starting interview:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



export {
    startInterview
}