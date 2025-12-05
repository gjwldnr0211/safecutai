import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2, VideoOff, ScanFace, ImagePlus, X, Camera, Palette, Sparkles, BrainCircuit } from 'lucide-react';
import { playSound } from '../utils/audio';
import { analyzeHairStyle, getHairstyleFromImage } from '../services/geminiService';
import { StyleRecommendation, HairStyleTemplate, AnalysisOptions } from '../types';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface Props {
  onComplete: (recommendation: StyleRecommendation, imageBase64: string | null, options: AnalysisOptions) => void;
  lang: 'ko' | 'en';
}

// --- TEMPLATE DEFINITIONS ---

const MALE_TEMPLATES: HairStyleTemplate[] = [
  // SHORT
  {
    id: 'ivyleague',
    name: '아이비리그 컷',
    nameEn: 'Ivy League Cut',
    description: '짧고 스포티한 남성미',
    descriptionEn: 'Short, sporty, and masculine',
    category: 'Short',
    svgPath: (
       <path d="M100,60 L100,40 Q160,20 220,40 L220,60 Q260,100 250,180 Q240,220 200,240 Q120,240 80,220 Q70,180 60,100 Q60,60 100,60" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },
  {
    id: 'pomade',
    name: '포마드',
    nameEn: 'Pomade / Side Part',
    description: '신뢰감을 주는 클래식한 스타일',
    descriptionEn: 'Classic style giving trust',
    category: 'Short',
    svgPath: (
        <path d="M90,60 Q150,20 230,50 Q260,80 250,160 Q240,200 200,210 Q120,210 80,190 Q70,150 60,100 Q60,60 90,60 M200,50 L190,80 M80,120 Q120,100 160,90" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },
  {
    id: 'dropcut',
    name: '드롭 컷',
    nameEn: 'Drop Cut',
    description: '옆은 다운, 앞은 세련되게',
    descriptionEn: 'Down on sides, stylish front',
    category: 'Short',
    svgPath: (
        <path d="M90,60 Q160,20 230,60 Q260,100 250,160 Q240,200 200,220 Q120,220 80,200 Q70,160 60,100 Q60,60 90,60 M120,60 Q160,40 200,60" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },
  {
    id: 'crop',
    name: '크롭 컷',
    nameEn: 'Crop Cut',
    description: '직선적인 앞머리의 트렌디함',
    descriptionEn: 'Trendy straight bangs',
    category: 'Short',
    svgPath: (
        <path d="M80,70 Q160,30 240,70 Q270,110 260,180 Q250,220 160,230 Q70,220 60,180 Q50,110 80,70 M90,80 L230,80" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },
  {
    id: 'regent',
    name: '리젠트 컷',
    nameEn: 'Regent Cut',
    description: '이마를 드러낸 신뢰감 있는 스타일',
    descriptionEn: 'Forehead exposed, trustworthy look',
    category: 'Short',
    svgPath: (
        <path d="M100,50 Q160,10 220,50 Q250,100 240,180 Q230,220 160,230 Q90,220 80,180 Q70,100 100,50 M120,50 L140,30 M160,30 L180,50" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },

  // MEDIUM
  {
    id: 'dandy',
    name: '내추럴 댄디',
    nameEn: 'Natural Dandy',
    description: '실패 없는 국민 남성 스타일',
    descriptionEn: 'Classic, fail-proof style',
    category: 'Medium',
    svgPath: (
      <path d="M90,70 Q160,10 230,70 Q270,120 260,200 Q250,250 200,270 Q160,280 120,270 Q70,250 60,200 Q50,120 90,70" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },
  {
    id: 'seethrough',
    name: '시스루 댄디',
    nameEn: 'See-through Dandy',
    description: '가볍고 부드러운 앞머리',
    descriptionEn: 'Light and soft bangs',
    category: 'Medium',
    svgPath: (
      <path d="M90,70 Q160,10 230,70 Q270,120 260,200 Q250,250 200,270 Q160,280 120,270 Q70,250 60,200 Q50,120 90,70 M130,70 L130,120 M160,70 L160,120 M190,70 L190,120" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },
  {
    id: 'parted',
    name: '가르마/애즈',
    nameEn: 'Parted / Adze',
    description: '부드러운 감성 스타일',
    descriptionEn: 'Soft, emotional vibe',
    category: 'Medium',
    svgPath: (
      <path d="M90,90 Q120,30 160,80 Q200,30 230,90 Q270,150 260,220 Q250,260 160,260 Q70,260 60,220 Q50,150 90,90" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },
  {
    id: 'guile',
    name: '가일 컷',
    nameEn: 'Guile Cut',
    description: '한쪽은 내리고 한쪽은 포마드',
    descriptionEn: 'Half down, half pomade',
    category: 'Medium',
    svgPath: (
        <path d="M100,70 Q130,100 160,60 Q200,20 230,60 Q260,120 260,200 Q250,250 200,270 Q160,280 120,270 Q70,250 60,200 Q60,120 100,70 M160,60 Q160,120 140,150" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },
  {
    id: 'shadow',
    name: '쉐도우 펌',
    nameEn: 'Shadow Perm',
    description: 'S컬의 볼륨감 있는 웨이브',
    descriptionEn: 'Voluminous S-curl wave',
    category: 'Medium',
    svgPath: (
        <path d="M80,80 Q120,40 160,80 Q200,40 240,80 Q280,140 270,220 Q260,260 160,270 Q60,260 50,220 Q40,140 80,80 M100,80 Q120,120 140,80 M180,80 Q200,120 220,80" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },

  // LONG
  {
    id: 'leaf',
    name: '리프 컷',
    nameEn: 'Leaf Cut',
    description: '나뭇잎처럼 흐르는 긴 기장',
    descriptionEn: 'Flowing long length like a leaf',
    category: 'Long',
    svgPath: (
       <path d="M80,80 Q160,20 240,80 Q290,150 280,250 Q240,300 160,300 Q80,300 40,250 Q30,150 80,80 M80,80 Q60,180 40,220 M240,80 Q260,180 280,220" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },
  {
    id: 'wolf',
    name: '울프 컷',
    nameEn: 'Wolf Cut',
    description: '거칠고 힙한 텍스처',
    descriptionEn: 'Rough and hip texture',
    category: 'Long',
    svgPath: (
        <path d="M90,60 Q160,20 230,60 Q260,100 250,180 Q280,240 280,300 L260,320 Q240,280 220,240 Q100,240 80,280 L60,320 Q40,280 40,240 Q60,180 70,100 Q60,60 90,60" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  }
];

const FEMALE_TEMPLATES: HairStyleTemplate[] = [
  // SHORT
  {
    id: 'bob',
    name: '태슬/단발',
    nameEn: 'Tassel / Bob',
    description: '시크하고 도도한 칼단발',
    descriptionEn: 'Chic and sharp bob',
    category: 'Short',
    svgPath: (
       <path d="M90,60 Q160,10 230,60 Q260,80 260,250 L260,280 Q160,290 60,280 L60,250 Q60,80 90,60" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },
  {
    id: 'ruffle',
    name: '러플 펌',
    nameEn: 'Ruffle Perm',
    description: '자유분방한 컬의 숏 스타일',
    descriptionEn: 'Free-spirited curly short style',
    category: 'Short',
    svgPath: (
        <path d="M80,70 Q160,20 240,70 Q280,100 270,220 Q290,260 260,280 Q160,290 60,280 Q30,260 50,220 Q40,100 80,70 M80,120 Q100,160 120,120 M200,120 Q220,160 240,120" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" strokeDasharray="5,5" />
    )
  },
  {
    id: 'shortcut',
    name: '숏 컷',
    nameEn: 'Pixie / Short',
    description: '도시적이고 세련된 무드',
    descriptionEn: 'Urban and sophisticated',
    category: 'Short',
    svgPath: (
        <path d="M100,60 Q160,20 220,60 Q250,100 240,180 Q230,220 200,240 Q120,240 90,220 Q80,180 70,100 Q70,60 100,60 M80,180 L70,220" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },
  {
    id: 'bonnie',
    name: '보니 펌',
    nameEn: 'Bonnie Perm',
    description: '귀엽고 사랑스러운 C컬 단발',
    descriptionEn: 'Cute and lovely C-curl',
    category: 'Short',
    svgPath: (
        <path d="M80,70 Q160,10 240,70 Q280,120 270,220 Q290,260 260,280 Q160,290 60,280 Q30,260 50,220 Q40,120 80,70" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },

  // MEDIUM
  {
    id: 'medium_c',
    name: '중단발 C컬',
    nameEn: 'Medium C-Curl',
    description: '단정하고 우아한 오피스 룩',
    descriptionEn: 'Neat and elegant office look',
    category: 'Medium',
    svgPath: (
       <path d="M100,60 Q160,10 220,60 Q260,100 260,240 Q260,280 230,270 Q160,280 90,270 Q60,280 60,240 Q60,100 100,60" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },
  {
    id: 'build',
    name: '빌드/S컬',
    nameEn: 'Build / S-Curl',
    description: '여성스럽고 우아한 웨이브',
    descriptionEn: 'Feminine and elegant wave',
    category: 'Medium',
    svgPath: (
       <path d="M100,60 Q160,10 220,60 Q270,120 280,200 Q300,280 280,340 Q160,360 40,340 Q20,280 40,200 Q50,120 100,60 M40,180 Q20,250 30,320 M280,180 Q300,250 290,320" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },
  {
    id: 'hush',
    name: '허쉬/레이어드',
    nameEn: 'Hush / Layered',
    description: '가볍고 층이 많은 스타일',
    descriptionEn: 'Light and layered style',
    category: 'Medium',
    svgPath: (
       <path d="M100,60 Q160,10 220,60 Q270,120 280,200 Q290,280 250,320 Q160,340 70,320 Q30,280 40,200 Q50,120 100,60 M40,200 Q30,250 20,300 M280,200 Q290,250 300,300" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },
  {
    id: 'wind',
    name: '윈드 컷',
    nameEn: 'Wind Cut',
    description: '바람에 날린 듯 자연스러운',
    descriptionEn: 'Natural, wind-blown look',
    category: 'Medium',
    svgPath: (
        <path d="M90,60 Q160,20 230,60 Q260,100 250,200 Q270,250 260,300 Q160,320 60,300 Q50,250 70,200 Q60,100 90,60" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },

  // LONG
  {
    id: 'grace',
    name: '그레이스 펌',
    nameEn: 'Grace Perm',
    description: '풍성하고 고급스러운 여신 웨이브',
    descriptionEn: 'Voluminous and luxurious waves',
    category: 'Long',
    svgPath: (
        <path d="M90,50 Q160,10 230,50 Q280,100 300,200 Q320,300 280,420 Q160,440 40,420 Q0,300 20,200 Q40,100 90,50 M20,250 Q0,300 30,350 M300,250 Q320,300 290,350" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },
  {
    id: 'hippie',
    name: '히피 펌',
    nameEn: 'Hippie Perm',
    description: '자유분방한 컬이 매력적인',
    descriptionEn: 'Free-spirited, charming curls',
    category: 'Long',
    svgPath: (
       <path d="M80,70 Q100,50 120,70 Q140,50 160,70 Q180,50 200,70 Q220,50 240,70 Q280,150 290,250 Q280,320 160,330 Q40,320 30,250 Q40,150 80,70" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" strokeDasharray="10,5" />
    )
  },
  {
    id: 'elisabeth',
    name: '엘리자벳 펌',
    nameEn: 'Elizabeth Perm',
    description: '굵고 화려한 여신 머리',
    descriptionEn: 'Bold and glamorous goddess hair',
    category: 'Long',
    svgPath: (
        <path d="M90,50 Q160,10 230,50 Q280,100 290,200 Q310,300 280,380 Q160,400 40,380 Q10,300 30,200 Q40,100 90,50 M30,250 Q10,300 40,350 M290,250 Q310,300 280,350" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  },
  {
    id: 'sleek',
    name: '슬릭 컷',
    nameEn: 'Sleek Cut',
    description: '가볍게 떨어지는 생머리',
    descriptionEn: 'Lightly falling straight hair',
    category: 'Long',
    svgPath: (
        <path d="M100,50 Q160,20 220,50 Q260,80 260,250 L260,400 Q160,410 60,400 L60,250 Q60,80 100,50" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
    )
  }
];

const HAIR_COLORS = [
    { name: 'Original', label: '유지', labelEn: 'Orig', hex: 'transparent', border: true },
    { name: 'Black', label: '블랙', labelEn: 'Black', hex: '#1a1a1a' },
    { name: 'Dark Brown', label: 'D.브라운', labelEn: 'D.Brwn', hex: '#4a3b32' },
    { name: 'Ash Brown', label: '애쉬', labelEn: 'Ash', hex: '#7a7065' },
    { name: 'Red Wine', label: '와인', labelEn: 'Wine', hex: '#5c1a1a' },
    { name: 'Blonde', label: '블론드', labelEn: 'Blonde', hex: '#e6c885' },
    { name: 'Pink', label: '핑크', labelEn: 'Pink', hex: '#ff9eac' },
    { name: 'Grey', label: '그레이', labelEn: 'Grey', hex: '#9ca3af' },
    { name: 'Blue', label: '블루', labelEn: 'Blue', hex: '#60a5fa' },
    { name: 'Violet', label: '바이올렛', labelEn: 'Violet', hex: '#a78bfa' },
];

const AnalysisStep: React.FC<Props> = ({ onComplete, lang }) => {
  const isEn = lang === 'en';
  
  const LOADING_STEPS = [
    { text: isEn ? "Scanning face..." : "얼굴 윤곽 스캔 중...", subText: isEn ? "Analyzing Face Shape" : "Analyzing Face Shape", icon: <ScanFace className="w-8 h-8 text-teal-400" /> },
    { text: isEn ? "Analyzing features..." : "이목구비 비율 분석...", subText: isEn ? "Calculating Features" : "Calculating Features", icon: <BrainCircuit className="w-8 h-8 text-blue-400" /> },
    { text: isEn ? "Detecting skin tone..." : "퍼스널 컬러 진단 중...", subText: isEn ? "Detecting Skin Tone" : "Detecting Skin Tone", icon: <Palette className="w-8 h-8 text-rose-400" /> },
    { text: isEn ? "Generating new look..." : "AI 스타일 합성 중...", subText: isEn ? "Generating New Look" : "Generating New Look", icon: <Sparkles className="w-8 h-8 text-purple-400" /> }
  ];

  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [modelLoading, setModelLoading] = useState(true);
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [manualMode, setManualMode] = useState(false); // Fallback if AI fails
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Settings State - MOVED TO VISIBLE CONTROLS
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [currentLength, setCurrentLength] = useState<'Short' | 'Medium' | 'Long'>('Short');
  const [targetColor, setTargetColor] = useState('Original');

  // AR State
  const [currentTemplateIdx, setCurrentTemplateIdx] = useState(0);
  
  // Custom Upload State
  const [customImage, setCustomImage] = useState<string | null>(null);
  
  // Auto-Tracking State
  const [faceDetected, setFaceDetected] = useState(false);
  const [arStyle, setArStyle] = useState({ scale: 1, x: 50, y: 50 });
  
  // Refs for tracking loop
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  // Filter Templates based on Gender AND Length
  const allGenderTemplates = gender === 'Male' ? MALE_TEMPLATES : FEMALE_TEMPLATES;
  const activeTemplates = allGenderTemplates.filter(t => t.category === currentLength);

  // Safety check to ensure index is always valid even during render before effect runs
  const safeTemplateIdx = currentTemplateIdx < activeTemplates.length ? currentTemplateIdx : 0;
  const currentTemplate = activeTemplates[safeTemplateIdx];

  // Reset template index when gender or length changes
  useEffect(() => {
    setCurrentTemplateIdx(0);
  }, [gender, currentLength]);

  
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const cameraPromise = startCamera();
        
        // Race condition: If model loads slow, provide fallback UI
        loadFaceModel();
        
        await cameraPromise;
        
        if (isMounted) {
            predictWebcam(performance.now());
        }
      } catch (e) {
        console.error("Initialization error:", e);
        if (isMounted) setError(isEn ? "System initialization failed." : "시스템 초기화 중 오류가 발생했습니다.");
      }
    };

    init();

    // Show manual fallback button if loading takes more than 2 seconds
    const fallbackTimer = window.setTimeout(() => {
        if (isMounted) setShowManualFallback(true);
    }, 2000);

    return () => {
      isMounted = false;
      window.clearTimeout(fallbackTimer);
      stopCamera();
      if (requestRef.current) window.cancelAnimationFrame(requestRef.current);
      if (faceLandmarkerRef.current) {
          faceLandmarkerRef.current.close();
          faceLandmarkerRef.current = null;
      }
    };
  }, [isEn]); // Re-run if language changes to update error messages if any

  const loadFaceModel = async () => {
    try {
        if (faceLandmarkerRef.current) return;

        console.log("Loading FaceLandmarker model...");
        
        const loadPromise = async () => {
            const filesetResolver = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
            );
            
            // Attempt GPU first for better performance and to avoid CPU delegate initialization logs which confuse users
            try {
                return await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "GPU"
                    },
                    outputFaceBlendshapes: false,
                    runningMode: "VIDEO",
                    numFaces: 1,
                    minFaceDetectionConfidence: 0.5,
                    minFacePresenceConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });
            } catch (e) {
                console.warn("GPU delegate failed, falling back to CPU", e);
                // CPU Fallback
                return await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "CPU"
                    },
                    outputFaceBlendshapes: false,
                    runningMode: "VIDEO",
                    numFaces: 1,
                    minFaceDetectionConfidence: 0.5,
                    minFacePresenceConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });
            }
        };

        // Extended timeout to 15s to handle slower network connections for WASM files
        const timeoutPromise = new Promise((_, reject) => 
            window.setTimeout(() => reject(new Error("Model load timeout")), 15000)
        );

        faceLandmarkerRef.current = await Promise.race([loadPromise(), timeoutPromise]) as FaceLandmarker;
        console.log("FaceLandmarker loaded successfully");
        setModelLoading(false);
    } catch (err) {
        console.warn("Model loading failed or timed out. Switching to manual mode.", err);
        setModelLoading(false); 
        setManualMode(true);
    }
  };

  const predictWebcam = (timestamp?: number) => {
    const video = videoRef.current;
    const landmarker = faceLandmarkerRef.current;

    // Skip detection if we are using a custom image (overlay disabled)
    if (customImage) return;

    // Ensure video is actually ready
    if (video && landmarker && !video.paused && !video.ended && video.readyState >= 2) {
        let startTimeMs = timestamp ?? performance.now();
        if (lastVideoTimeRef.current !== video.currentTime) {
            lastVideoTimeRef.current = video.currentTime;
            
            try {
                const results = landmarker.detectForVideo(video, startTimeMs);

                if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                    setFaceDetected(true);
                    const landmarks = results.faceLandmarks[0];
                    const leftEar = landmarks[234];
                    const rightEar = landmarks[454];
                    const topHead = landmarks[10];
                    
                    const faceWidth = Math.sqrt(
                        Math.pow(rightEar.x - leftEar.x, 2) + 
                        Math.pow(rightEar.y - leftEar.y, 2)
                    );

                    const centerX = (leftEar.x + rightEar.x) / 2;
                    const centerY = topHead.y;

                    setArStyle(prev => {
                        const smoothFactor = 0.2;
                        // ADJUSTED SCALE: Reduced from 5.5 to 4.0 for better fit
                        const targetScale = faceWidth * 4.0; 
                        const targetX = (1 - centerX) * 100;
                        const targetY = centerY * 100;

                        return {
                            scale: prev.scale + (targetScale - prev.scale) * smoothFactor,
                            x: prev.x + (targetX - prev.x) * smoothFactor,
                            y: prev.y + (targetY - prev.y) * smoothFactor
                        };
                    });
                } else {
                    setFaceDetected(false);
                }
            } catch (e) {
                // Log only once per second to avoid spam if error persists
                if (Math.random() < 0.01) console.warn("Detection error:", e);
            }
        }
    }
    requestRef.current = window.requestAnimationFrame(predictWebcam);
  };

  const startCamera = async () => {
    try {
      const constraints = {
        video: { 
          facingMode: 'user',
          // Optimize for mobile portrait to reduce cropping zoom
          width: { ideal: 720 },
          height: { ideal: 1280 }
        }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera Error:", err);
      // Fallback for devices that don't support high res
      try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
          setStream(fallbackStream);
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
          }
      } catch (fallbackErr) {
          setError(isEn ? "Camera access denied." : "카메라를 실행할 수 없습니다. 권한을 확인해주세요.");
          throw fallbackErr;
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = (): string | null => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      }
    }
    return null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  const base64 = (event.target.result as string).split(',')[1];
                  setCustomImage(base64);
                  playSound('success');
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const clearCustomImage = () => {
      setCustomImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      playSound('click');
      // Restart tracking loop
      requestRef.current = window.requestAnimationFrame(predictWebcam);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setLoadingStepIndex(0);
    playSound('click');
    
    // Aesthetic Loading Timer
    const stepInterval = setInterval(() => {
        setLoadingStepIndex(prev => {
            if (prev < LOADING_STEPS.length - 1) return prev + 1;
            return prev;
        });
    }, 1500); // Change loading text every 1.5s

    try {
      const userBase64 = captureImage();
      let targetStyleName = "";
      let targetStyleDescription = "";

      if (customImage) {
          // 1. If using custom image, first analyze the hairstyle in that image
          const styleInfo = await getHairstyleFromImage(customImage, lang);
          targetStyleName = styleInfo.name;
          targetStyleDescription = styleInfo.description;
      } else {
          // 2. Use template (using currentTemplate which is safely computed)
          if (currentTemplate) {
            targetStyleName = isEn ? currentTemplate.nameEn : currentTemplate.name;
            targetStyleDescription = isEn ? currentTemplate.descriptionEn : currentTemplate.description;
          } else {
            // Fallback if list empty
            targetStyleName = isEn ? "Trendy Style" : "트렌디한 스타일";
            targetStyleDescription = isEn ? "Latest trendy hairstyle for your face shape." : "얼굴형에 어울리는 최신 유행 헤어스타일";
          }
      }
      
      const options: AnalysisOptions = { 
          gender, 
          currentLength,
          targetColor: targetColor === 'Original' ? undefined : targetColor,
          language: lang // Pass language option
      };
      
      const result = await analyzeHairStyle(userBase64, targetStyleDescription, options);
      
      // Override name if it was custom
      if (customImage) {
          result.name = isEn ? `[Upload] ${result.name}` : `[업로드] ${result.name}`;
      }

      playSound('success');
      onComplete(result, userBase64, options);
    } catch (error) {
      console.error(error);
      alert(isEn ? "Analysis failed. Please try again." : "분석 중 문제가 발생했습니다. 다시 시도해주세요.");
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const changeTemplate = (delta: number) => {
    if (customImage) return; // Disable when custom image is set
    playSound('hover');
    setCurrentTemplateIdx(prev => {
      const count = activeTemplates.length;
      if (count === 0) return 0;
      const next = prev + delta;
      if (next < 0) return count - 1;
      if (next >= count) return 0;
      return next;
    });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-black">
        <VideoOff className="w-16 h-16 text-slate-500 mb-4" />
        <p className="text-slate-400 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-primary text-white px-6 py-2 rounded-lg">
          {isEn ? "Retry" : "다시 시도"}
        </button>
      </div>
    );
  }

  const canProceed = faceDetected || customImage || manualMode;

  return (
    <div className="relative h-full w-full bg-black overflow-hidden">
      
      {/* 1. Zoomed-out Camera Container (Background) */}
      <div className="absolute inset-0 top-0 bottom-0 w-full h-full z-0 transform scale-[0.95] rounded-[2rem] overflow-hidden origin-center shadow-2xl border border-white/10 bg-gray-900">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
          onLoadedData={() => videoRef.current?.play().catch(() => {})}
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Custom Image Preview Overlay */}
        {customImage && (
            <div className="absolute inset-0 bg-black z-10 flex items-center justify-center">
                <img 
                    src={`data:image/jpeg;base64,${customImage}`} 
                    alt="Upload" 
                    className="max-w-full max-h-full object-contain" 
                />
                <button 
                    onClick={clearCustomImage}
                    className="absolute top-20 right-4 bg-black/50 text-white rounded-full p-2 shadow-md hover:bg-black/70 z-50"
                >
                    <X size={20} />
                </button>
            </div>
        )}

        {/* AR Overlay - Inside the scaled container so it matches the video coordinates */}
        {!customImage && !manualMode && currentTemplate && (
            <div 
                className="absolute z-10 pointer-events-none transition-transform duration-75 ease-out"
                style={{ 
                    left: `${arStyle.x}%`,
                    top: `${arStyle.y}%`,
                    transform: `translate(-50%, -20%) scale(${arStyle.scale})`,
                    width: '300px', 
                    height: '350px',
                    opacity: faceDetected ? 1 : 0.5 
                }}
            >
                <svg viewBox="0 0 320 350" className="w-full h-full text-white drop-shadow-[0_0_15px_rgba(13,148,136,0.6)]">
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    <g filter="url(#glow)">
                        {currentTemplate.svgPath}
                    </g>
                </svg>
            </div>
        )}
      </div>

      {/* 2. Top Bar (Overlay) */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 pt- safe-top flex justify-between items-center h-24 pointer-events-none">
         <div className="flex space-x-2 pointer-events-auto">
            {modelLoading && !customImage && (
                <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full animate-fade-in">
                    <Loader2 className="w-3 h-3 animate-spin text-teal-400" />
                    <span className="text-xs text-teal-400 font-medium">
                         {showManualFallback ? (isEn ? 'Delay...' : '로딩 지연...') : (isEn ? 'AI Loading' : 'AI 로딩')}
                    </span>
                    {showManualFallback && (
                        <button 
                            onClick={() => { setModelLoading(false); setManualMode(true); }}
                            className="ml-2 bg-white/20 text-white text-[10px] px-2 py-0.5 rounded hover:bg-white/30"
                        >
                            {isEn ? 'Manual' : '수동 전환'}
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* 3. Bottom Controls (Overlay with Gradient) */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pt-12 safe-bottom px-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
        
        {/* Manual Mode Hint (Centered above controls) */}
        {!customImage && manualMode && (
            <div className="flex justify-center mb-4 pointer-events-none">
                 <div className="bg-black/60 text-white/90 text-xs px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                    {isEn ? "Center your face in the frame" : "얼굴을 화면 중앙에 맞춰주세요"}
                 </div>
            </div>
        )}

        {/* 1. Control Row (Gender & Length) */}
        <div className="flex justify-between items-center gap-2 mb-3">
            <div className="flex bg-black/50 backdrop-blur-md rounded-xl p-1 border border-white/10">
                <button 
                    onClick={() => { setGender('Male'); playSound('click'); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${gender === 'Male' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                    {isEn ? 'Male' : '남성'}
                </button>
                <button 
                    onClick={() => { setGender('Female'); playSound('click'); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${gender === 'Female' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                    {isEn ? 'Female' : '여성'}
                </button>
            </div>
            
            <div className="flex bg-black/50 backdrop-blur-md rounded-xl p-1 border border-white/10 flex-1 justify-between">
                <button 
                    onClick={() => { setCurrentLength('Short'); playSound('click'); }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${currentLength === 'Short' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                    Short
                </button>
                <button 
                    onClick={() => { setCurrentLength('Medium'); playSound('click'); }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${currentLength === 'Medium' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                    Medium
                </button>
                <button 
                    onClick={() => { setCurrentLength('Long'); playSound('click'); }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${currentLength === 'Long' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                    Long
                </button>
            </div>
        </div>

        {/* 2. Color Swatches Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {HAIR_COLORS.map((color) => (
                <button
                    key={color.name}
                    onClick={() => { setTargetColor(color.name); playSound('click'); }}
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all relative border-2 
                        ${targetColor === color.name ? 'border-primary scale-110 shadow-[0_0_10px_rgba(20,184,166,0.5)]' : 'border-white/20 opacity-70 hover:opacity-100'}
                    `}
                    style={{ backgroundColor: color.hex }}
                >
                    {targetColor === color.name && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                    )}
                    {color.name === 'Original' && (
                        <span className="text-[8px] font-bold text-slate-400">{isEn ? 'Orig' : '기본'}</span>
                    )}
                </button>
            ))}
        </div>

        {/* Style Selector Carousel */}
        <div className="flex items-center justify-between px-2 bg-black/40 backdrop-blur-md rounded-2xl py-2 border border-white/10 mb-3">
            {!customImage && activeTemplates.length > 0 && (
                <button onClick={() => changeTemplate(-1)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors active:scale-95">
                    <ChevronLeft size={24} />
                </button>
            )}
            
            <div className="flex-1 flex flex-col items-center justify-center min-h-[40px]">
                {customImage ? (
                    <div className="text-center animate-fade-in">
                         <h3 className="text-base font-bold text-white mb-0.5">{isEn ? 'Uploaded Style' : '업로드된 스타일'}</h3>
                         <p className="text-[10px] text-teal-400">{isEn ? 'Applying style from photo' : '사진의 머리를 적용합니다'}</p>
                    </div>
                ) : activeTemplates.length > 0 ? (
                    <div className="text-center animate-fade-in" key={currentTemplate.id}>
                        <h3 className="text-base font-bold text-white mb-0.5">{isEn ? currentTemplate.nameEn : currentTemplate.name}</h3>
                        <p className="text-[10px] text-teal-400">{isEn ? currentTemplate.descriptionEn : currentTemplate.description}</p>
                    </div>
                ) : (
                     <div className="text-center">
                        <h3 className="text-base font-bold text-white mb-0.5">{isEn ? 'No Style' : '스타일 없음'}</h3>
                        <p className="text-[10px] text-red-400">{isEn ? 'No styles in this category.' : '해당 길이의 스타일이 없습니다.'}</p>
                    </div>
                )}
            </div>

            {!customImage && activeTemplates.length > 0 && (
                <button onClick={() => changeTemplate(1)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors active:scale-95">
                    <ChevronRight size={24} />
                </button>
            )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mb-6">
             <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload}
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm text-slate-300 w-16 rounded-2xl hover:bg-white/20 active:scale-95 transition-all border border-white/5"
            >
                <ImagePlus size={24} className="mb-1" />
                <span className="text-[10px]">{isEn ? "Photo" : "사진"}</span>
            </button>

            <button
            onClick={handleAnalyze}
            disabled={loading || !canProceed}
            className={`flex-1 font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2
                ${loading || !canProceed
                    ? 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-white/5' 
                    : 'bg-primary hover:bg-teal-500 text-white shadow-teal-900/50'}`}
            >
            {loading ? (
                <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{isEn ? "Analyzing..." : "스타일 분석 및 합성 중..."}</span>
                </>
            ) : (!canProceed) ? (
                <>
                <ScanFace className="w-5 h-5 animate-pulse" />
                <span>{isEn ? "Detecting Face" : "얼굴을 비춰주세요"}</span>
                </>
            ) : manualMode ? (
                <>
                <Camera className="w-5 h-5" />
                <span>{isEn ? "Capture & Analyze" : "촬영하고 스타일 확인"}</span>
                </>
            ) : (
                <>
                <CheckCircle2 className="w-5 h-5" />
                <span>{customImage ? (isEn ? "Use this style" : "이 스타일 적용하기") : (isEn ? "Try this style" : "이 스타일 어울릴까?")}</span>
                </>
            )}
            </button>
        </div>
      </div>

      {/* AESTHETIC LOADING OVERLAY */}
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-8">
            {/* Scan Line Effect */}
            <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
                <div className="w-full h-1 bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.8)] animate-scan"></div>
            </div>

            {/* Central Spinner */}
            <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full border-t-2 border-l-2 border-teal-500 animate-spin absolute inset-0"></div>
                <div className="w-24 h-24 rounded-full border-b-2 border-r-2 border-purple-500 animate-spin absolute inset-0" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
                <div className="w-24 h-24 flex items-center justify-center bg-slate-900 rounded-full shadow-2xl relative z-10 border border-slate-800">
                    <div className="animate-pulse">
                        {LOADING_STEPS[loadingStepIndex].icon}
                    </div>
                </div>
            </div>

            {/* Text Updates */}
            <div className="text-center space-y-1 z-10">
                <h3 className="text-xl font-bold text-white animate-pulse">
                    {LOADING_STEPS[loadingStepIndex].text}
                </h3>
                <p className="text-teal-400/80 text-xs tracking-wider uppercase font-medium">
                    {LOADING_STEPS[loadingStepIndex].subText}
                </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-xs h-1.5 bg-slate-800 rounded-full overflow-hidden mt-8 z-10 border border-slate-700/50">
                <div 
                    className="h-full bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                    style={{ width: `${((loadingStepIndex + 1) / LOADING_STEPS.length) * 100}%` }}
                ></div>
            </div>
            <p className="text-slate-500 text-[10px] mt-2">AI Processor Active</p>
        </div>
      )}
    </div>
  );
};

export default AnalysisStep;