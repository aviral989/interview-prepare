/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

/**
 * Lazily initializes and returns the GoogleGenAI client.
 * This ensures that if the environment variables are not loaded immediately,
 * the application doesn't crash on startup.
 */
export function getGemini(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined. Please add it to your Secrets or environment.");
    }
    genAI = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAI;
}
