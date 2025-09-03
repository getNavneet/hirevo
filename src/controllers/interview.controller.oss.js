import { interviewService } from '../services/interviewService.js';
import Joi from 'joi';

/**
 * Validation schema for the POST /interview request
 */
const interviewSchema = Joi.object({
  category: Joi.string()
    .valid('core', 'programming', 'personal','resume')
    .required(),
  subcategory: Joi.string().allow('', null), // optional
  level: Joi.string().allow('', null),        // optional
});

/**
 * POST /interview
 * Starts a new interview session
 */
export const startInterview = async (req, res) => {
  // 1️⃣ Validate body
  const { error, value } = interviewSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const { category, subcategory, level } = value;

  // 2️⃣ Handle resume upload (if any)
  let resumePath = null;
  if (req.file) {
    // Multer has already written the file to disk
    resumePath = req.file.path; // e.g. 'uploads/resumes/12345.pdf'
  }

  // 3️⃣ Identify the user (Passport, JWT middleware has attached `req.user`)
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'You must be logged in to start an interview.',
    });
  }
 // 4️⃣ Persist interview request & get a unique interview ID
  const interview = await interviewService.createInterview({
    userId,
    category,
    subcategory,
    level,
    resumePath
  });


  // 5️⃣ Return the ID back to the client – it will be used to join a socket room
  res.status(200).json({
    success: true,
    message: 'Interview initialized successfully',
    data: {
      interviewId: interview.id,
      category,
      subcategory,
      level,
    },
  });
};
