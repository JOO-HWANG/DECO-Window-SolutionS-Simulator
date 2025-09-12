
import { GoogleGenAI, Modality } from "@google/genai";
import { ProductType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function fileToGenerativePart(base64: string, mimeType: string) {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
}

export async function generateRecommendation(
  imageBase64: string,
  imageMimeType: string,
  productType: ProductType
): Promise<string> {
  try {
    const imagePart = fileToGenerativePart(imageBase64, imageMimeType);
    const prompt = `You are an expert interior designer. Analyze this image of a room and its window. Recommend the best ${productType} for this space. Suggest a specific style and color that would complement the existing decor. Provide a brief, one-paragraph rationale for your choice and some interior design tips related to window treatments. Be creative and inspiring.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating recommendation:", error);
    throw new Error("Failed to get a recommendation from the AI. Please try again.");
  }
}


export async function simulateWindowCovering(
    imageBase64: string,
    imageMimeType: string,
    productType: ProductType,
    colorName: string,
    productName: string,
    isDay: boolean
): Promise<string> {
    try {
        const imagePart = fileToGenerativePart(imageBase64, imageMimeType);
        
        const dayPrompt = `In the window area of this image, add photorealistic ${colorName} ${productName} (${productType}). It's daytime. Show soft sunlight filtering through the material, casting realistic, gentle shadows inside the room. The result must be hyper-realistic and blend seamlessly with the original image's lighting and perspective. The original window frame should be visible where appropriate.`;
        
        const nightPrompt = `In the window area of this image, add photorealistic ${colorName} ${productName} (${productType}). It's nighttime. The view is from inside the room looking at the window. The room has warm, ambient lighting on. Show how the ${productType} provide privacy, with only a very subtle hint of the interior light glowing through the material, highlighting its texture. The result must be hyper-realistic and blend seamlessly.`;

        const prompt = isDay ? dayPrompt : nightPrompt;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image-preview',
          contents: {
            parts: [
              imagePart,
              { text: prompt },
            ],
          },
          config: {
              responseModalities: [Modality.IMAGE, Modality.TEXT],
          },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              return part.inlineData.data;
            }
        }
        
        throw new Error("AI did not return an image. It may have refused the request.");

    } catch (error) {
        console.error(`Error generating ${isDay ? 'day' : 'night'} simulation:`, error);
        throw new Error(`Failed to generate the ${isDay ? 'day' : 'night'} simulation. The AI might be unable to process this image.`);
    }
}
