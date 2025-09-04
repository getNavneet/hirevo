// utils/resumeTextExtractor.js
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

function cleanExtractedText(text) {
  return text
    .replace(/\s+/g, ' ') // Normalize excessive whitespace
    .replace(/\n{3,}/g, '\n\n') // Limit line breaks
    .trim();
}


function validateResumeContent(text) {
  const minLength = 100;
  const commonResumeKeywords = [
    'experience', 'education', 'skills', 'work', 'job', 
    'university', 'college', 'email', 'phone'
  ];

  if (text.length < minLength) {
    throw new Error('Extracted text too short to be a valid resume');
  }

  const lowerText = text.toLowerCase();
  const hasKeywords = commonResumeKeywords.some(keyword => 
    lowerText.includes(keyword)
  );

  if (!hasKeywords) {
    console.warn('⚠️ Resume text may not be valid – no common resume keywords found');
  }

  return true;
}


export async function extractResumeText(filePath, mimeType) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    const maxSizeMB = 10;
    if (stats.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`File too large: ${stats.size} bytes (max: ${maxSizeMB}MB)`);
    }

    let rawText = '';

    if (mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);

      if (data.numpages > 3) {
        return `TOO_LONG:${data.numpages}`; // handled by controller
      }

      if (!data.text || data.text.trim().length < 50) {
        throw new Error('PDF appears to be image-based or contains insufficient text');
      }

      rawText = data.text;
    }

    else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      const docxResult = await mammoth.extractRawText({ path: filePath });
      rawText = docxResult.value;
    }

    else {
      throw new Error('Unsupported file type for resume text extraction');
    }

    const cleanedText = cleanExtractedText(rawText);
    validateResumeContent(cleanedText);

    return cleanedText;

  } catch (error) {
    console.error(`⚠️ Error extracting resume text from ${path.basename(filePath)}: ${error.message}`);
    throw error; 
  }
}
