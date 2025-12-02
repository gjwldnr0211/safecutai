import React from 'react';

export interface RecommendedColor {
  name: string;
  hex: string;
  description: string;
}

export interface StyleRecommendation {
  name: string;
  description: string;
  faceShape?: string; // Detected face shape (e.g., "Round", "Oval")
  reason: string;
  stylingTips?: string[]; // Step-by-step styling instructions
  score?: number; // Suitability score (0-100)
  imageUrl?: string; // Base64 image data
  
  // Personal Color Fields
  personalColor?: string; // e.g., "가을 웜톤"
  colorReason?: string; // Reasoning for the color analysis
  recommendedColors?: RecommendedColor[]; // List of 2 recommended colors
}

export interface AnalysisOptions {
  gender: 'Male' | 'Female';
  currentLength: 'Short' | 'Medium' | 'Long';
  targetColor?: string;
  language?: 'ko' | 'en'; // Added language support
}

export enum AppStep {
  WELCOME = 0,
  ANALYSIS = 1,
  RESULT = 2,
}

export interface HairStyleTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Short' | 'Medium' | 'Long';
  svgPath: React.ReactNode;
  nameEn: string;        // Added English Name
  descriptionEn: string; // Added English Description
}