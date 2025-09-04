// utils/resumeTextExtractor.js
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import path from 'path';

export async function extractResumeText(filePath, mimeType) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    if (mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      if (data.numpages > 3) {
        return `TOO_LONG:${data.numpages}`; // Handle in controller
      }

      return data.text.trim();
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      mimeType === 'application/msword'
    ) {
      const docxResult = await mammoth.extractRawText({ path: filePath });
      return docxResult.value.trim();
    }

    throw new Error('Unsupported file type for resume text extraction');
  } catch (error) {
    console.error(`⚠️ Error extracting resume text: ${error.message}`);
    return '';
  }
}
