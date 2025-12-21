import { GoogleGenAI, Type } from "@google/genai";
import { SpeakerSpecs, SystemConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAmpRecommendation = async (specs: SpeakerSpecs): Promise<string> => {
  try {
    const prompt = `
      I am a car audio expert. Based on the following speaker specifications, suggest the ideal amplifier specifications.
      Speaker Details: Type: ${specs.type}, Size: ${specs.size}, RMS: ${specs.rmsPower}W, Impedance: ${specs.impedance}Ω, Voice Coils: ${specs.voiceCoils}.
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text || "Error.";
  } catch (error) {
    return "Error connecting to AI service.";
  }
};

export const getSystemRecommendation = async (system: SystemConfig): Promise<string> => {
  try {
    const prompt = `
      Act as a world-class car audio installer and system architect. 
      I have designed a system with the following components. Please analyze it and provide a comprehensive "System Blueprint".

      SYSTEM CONFIGURATION:
      - Front Stage:
        ${system.frontDoor.enabled ? `- Door: ${system.frontDoor.size} ${system.frontDoor.isComponent ? '(Component)' : ''}` : ''}
        ${system.frontDash.enabled ? `- Dash: ${system.frontDash.size}` : ''}
        ${system.frontPillars.enabled ? `- Pillars: ${system.frontPillars.size}` : ''}
        ${system.centerChannel.enabled ? `- Center: ${system.centerChannel.size}` : ''}
      - Rear Stage:
        ${system.rearDoor.enabled ? `- Rear Door: ${system.rearDoor.size} ${system.rearDoor.isComponent ? '(Component)' : ''}` : ''}
        ${system.rearDeck.enabled ? `- Rear Deck: ${system.rearDeck.size}` : ''}
      - Subwoofer Stage:
        ${system.subwoofer.enabled ? `- ${system.subwoofer.count}x ${system.subwoofer.size} in ${system.subwoofer.location} (${system.subwoofer.enclosureType})` : 'None'}

      PLEASE PROVIDE THE FOLLOWING (Format in Markdown):
      1. **Amplifier Channels Needed**: Suggest the channel configuration (e.g., "5-Channel Amp" or "4-Channel + Monoblock"). 
      2. **DSP Strategy**: How should the channels be routed? (e.g., Active Front Stage vs Passive Crossovers).
      3. **Wiring Diagram Description**: A clear text-based flow of how to wire this (Source -> DSP -> Amps -> Speakers).
      4. **Estimated Power Requirements**: Suggest RMS power ratings for the selected speaker sizes.
      5. **Enclosure Tip**: Based on the subwoofer choice (${system.subwoofer.enclosureType}), give one tuning tip.
      
      Keep it professional, concise, and structured.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Could not generate system architecture.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating system architecture. Please check API Key.";
  }
};

export const getVehicleModels = async (year: string, make: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `List only the popular vehicle models for the year ${year} and make ${make}. Return ONLY a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    const models = JSON.parse(response.text || "[]");
    return models;
  } catch (error) {
    console.error("Error fetching models:", error);
    return [];
  }
};

export const getVehicleSpecificRecommendations = async (year: string, make: string, model: string, budget: string): Promise<string> => {
  try {
    const prompt = `
      Perform a deep dive research into the car audio configuration for a ${year} ${make} ${model}.
      
      BUDGET TIER: ${budget}
      
      TASKS:
      1. Identify factory speaker locations and sizes for this specific vehicle.
      2. Recommend a complete audio upgrade path including specific component brands and models that fit this budget.
      3. Identify potential installation hurdles (e.g. factory amplifier bypass, specialized speaker adapters, active noise cancellation interference).
      4. Suggest a specific Head Unit or DSP integration strategy for this dash layout.

      FORMAT:
      Use professional Markdown. Include a section for "Fitment Specs", "Recommended Gear", and "Installation Pro-Tips".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Could not generate vehicle recommendations.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error: Unable to reach the AI Architect. Please verify your connection.";
  }
};
