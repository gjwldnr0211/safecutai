import { GoogleGenAI, Type } from "@google/genai";
import { StyleRecommendation, AnalysisOptions } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getHairstyleFromImage = async (base64Image: string, lang: 'ko' | 'en' = 'ko'): Promise<{name: string, description: string}> => {
    const modelId = "gemini-2.5-flash";
    const langInstruction = lang === 'en' ? "Answer in English." : "Answer in Korean.";
    
    const prompt = `
      Analyze the hairstyle in this image specifically for a general hair salon order.
      ${langInstruction}
      Return a JSON object with:
      - name: A short, catchy name for this style.
      - description: A concise description of the cut and texture.
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: {
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING }
                    },
                    required: ["name", "description"]
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        throw new Error("No text response");
    } catch (e) {
        console.error("Failed to analyze reference image", e);
        return { 
            name: lang === 'en' ? "Uploaded Style" : "업로드된 스타일", 
            description: lang === 'en' ? "Please cut it like this photo." : "사진과 동일하게 잘라주세요." 
        };
    }
};

export const analyzeHairStyle = async (
  imageBase64: string | null,
  targetStyle: string,
  options?: AnalysisOptions
): Promise<StyleRecommendation> => {
  
  const lang = options?.language || 'ko';
  const isEn = lang === 'en';

  // 1. Text Analysis (General Persona)
  const analysisModelId = "gemini-2.5-flash";
  
  const systemInstructionKo = `
    당신은 20년 경력의 청담동 헤어 디자이너이자 퍼스널 컬러 전문가입니다.
    단순히 스타일을 설명하는 것을 넘어, '얼굴형'과 '피부톤(퍼스널 컬러)'을 기반으로 종합적인 스타일링 솔루션을 제공해야 합니다.
    답변은 반드시 한국어로 작성하세요.
  `;
  
  const systemInstructionEn = `
    You are a professional hair stylist and personal color expert with 20 years of experience.
    Provide comprehensive styling solutions based on 'Face Shape' and 'Skin Tone (Personal Color)'.
    Analyze the user's features and explain why the style fits them.
    All responses MUST be in English.
  `;

  const systemInstruction = isEn ? systemInstructionEn : systemInstructionKo;

  const genderInfo = options?.gender ? `Gender: ${options.gender}` : '';
  const lengthInfo = options?.currentLength ? `Current Length: ${options.currentLength}` : '';
  const colorInfo = options?.targetColor ? `Target Color: ${options.targetColor}` : '';

  const prompt = `
    ${genderInfo}
    ${lengthInfo}
    ${colorInfo}
    Target Style: ${targetStyle}
    ${imageBase64 ? "User photo attached." : "No photo."}
    
    Return the analysis result in JSON format:
    - name: Style Name (Trendy)
    - faceShape: Analyzed face shape (e.g. "Oval", "Round")
    - description: Order script for the hair stylist (Concise, < 5 lines).
    - reason: Why this style fits the user's face shape.
    - stylingTips: 3-step home styling guide (Array of strings).
    - personalColor: Personal color analysis (e.g. "Spring Warm", "Winter Cool")
    - colorReason: Reasoning for personal color.
    - recommendedColors: 2 recommended hair colors (Array of objects with name, hex, description).
  `;

  let recommendation: StyleRecommendation;

  try {
    const parts: any[] = [{ text: prompt }];
    if (imageBase64) {
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } });
    }

    const response = await ai.models.generateContent({
      model: analysisModelId,
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            faceShape: { type: Type.STRING, description: "Analyzed face shape" },
            description: { type: Type.STRING },
            reason: { type: Type.STRING },
            stylingTips: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "3 step styling guide"
            },
            personalColor: { type: Type.STRING, description: "Personal color analysis result" },
            colorReason: { type: Type.STRING, description: "Reasoning for personal color" },
            recommendedColors: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        hex: { type: Type.STRING },
                        description: { type: Type.STRING }
                    },
                    required: ["name", "hex", "description"]
                },
                description: "List of 2 recommended hair colors"
            }
          },
          required: ["name", "faceShape", "description", "reason", "stylingTips", "personalColor", "colorReason", "recommendedColors"]
        }
      }
    });

    if (response.text) {
      recommendation = JSON.parse(response.text) as StyleRecommendation;
    } else {
      throw new Error("Empty analysis response");
    }

    // 2. Image Generation (Face-Swap / Hairstyle Transfer)
    try {
      let imageParts: any[] = [];
      
      const genderPrompt = options?.gender ? (options.gender === 'Male' ? 'Man' : 'Woman') : 'Person';
      const colorPrompt = options?.targetColor ? `Hair color must be ${options.targetColor}.` : '';

      if (imageBase64) {
          // Use user's photo to apply the new hairstyle (Face-Swap equivalent)
          const imagePrompt = `
            Update this photo to give the person the following hairstyle: "${recommendation.name}".
            
            Hairstyle Details: ${recommendation.description}. ${colorPrompt}
            Gender: ${genderPrompt}
            
            CRITICAL INSTRUCTIONS:
            1. PRESERVE THE USER'S FACE: Keep the facial features, eyes, nose, mouth, and skin tone EXACTLY as they are in the original photo.
            2. PRESERVE THE EXPRESSION: Keep the original facial expression.
            3. PRESERVE THE BACKGROUND: Keep the background and clothing as close to original as possible.
            4. ONLY CHANGE THE HAIR: Replace the original hair with the requested "${recommendation.name}" style.
            5. REALISM: The hair must look photorealistic and naturally blended with the user's head.
          `;
          
          imageParts = [
              { text: imagePrompt },
              {
                  inlineData: {
                      mimeType: 'image/jpeg',
                      data: imageBase64
                  }
              }
          ];
      } else {
          // Fallback if no image provided
          const imagePrompt = `A high-quality, photorealistic portrait of a Korean ${genderPrompt} with the hairstyle "${recommendation.name}". 
          Description of hair: ${recommendation.description}. ${colorPrompt} 
          The person is wearing a simple shirt, professional look, studio lighting, neutral background. 
          Focus on the hair details.`;
          
          imageParts = [{ text: imagePrompt }];
      }

      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: imageParts,
        },
        config: {
            imageConfig: {
                aspectRatio: "1:1",
            }
        }
      });

      // Iterate to find image part
      if (imageResponse.candidates?.[0]?.content?.parts) {
        for (const part of imageResponse.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
             recommendation.imageUrl = `data:image/png;base64,${part.inlineData.data}`;
             break;
          }
        }
      }
    } catch (imgError) {
      console.error("Image generation failed:", imgError);
      // Fail gracefully, just return text recommendation without image
    }

    return recommendation;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error(isEn ? "Failed to analyze style." : "스타일 분석에 실패했습니다.");
  }
};

export const findNearbySalons = async (latitude: number, longitude: number, styleName: string): Promise<{ text: string, chunks: any[] }> => {
    // This function is removed in functionality but kept for type safety if imported elsewhere, though mostly unused now.
    // Keeping minimal implementation to satisfy potential legacy calls if any.
    return { text: "Service disabled.", chunks: [] };
};