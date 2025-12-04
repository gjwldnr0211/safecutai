import React, { useState, useRef, useEffect } from 'react';
import { StyleRecommendation, AnalysisOptions } from '../types';
import { playSound } from '../utils/audio';
import { analyzeHairStyle } from '../services/geminiService';
import { MessageSquareOff, ShieldCheck, RefreshCcw, Settings2, RotateCcw, Info, Sparkles, Share2, Download, Palette, ScanFace, MapPin, ChevronRight, X, UserCheck } from 'lucide-react';

interface Props {
  recommendations: StyleRecommendation[] | StyleRecommendation;
  userImage: string | null;
  onSelect: (style: StyleRecommendation) => void;
  options?: AnalysisOptions;
  lang?: 'ko' | 'en';
}

const COLORS = [
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

const ResultCard: React.FC<Props> = ({ recommendations, userImage, onSelect, options, lang = 'ko' }) => {
  const isEn = lang === 'en';
  const [result, setResult] = useState<StyleRecommendation>(
    Array.isArray(recommendations) ? recommendations[0] : recommendations
  );
  
  // Adjustment States
  const [length, setLength] = useState(0); // -1: Short, 0: Medium, 1: Long
  const [curl, setCurl] = useState(0); // -1: Straight, 0: Natural, 1: Curly
  const [selectedColor, setSelectedColor] = useState(options?.targetColor || 'Original');
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [showControls, setShowControls] = useState(false);
  
  // Modals
  const [showFaceAnalysis, setShowFaceAnalysis] = useState(false);
  const [showStylingGuide, setShowStylingGuide] = useState(false);
  const [showColorAnalysis, setShowColorAnalysis] = useState(false);

  // View State (Replaces Slider)
  const [activeView, setActiveView] = useState<'before' | 'after'>('after');

  const handleRestart = () => {
    playSound('click');
    onSelect(result); // In this context, onSelect will trigger reset in App.tsx
  };

  const handleUpdateStyle = async () => {
    if (!userImage) return;
    
    setIsUpdating(true);
    playSound('click');

    try {
        let modification = "";
        if (length === -1) modification += isEn ? "short and neat " : "짧고 단정한 ";
        if (length === 1) modification += isEn ? "long " : "길이감 있는 ";
        if (curl === -1) modification += isEn ? "straight " : "직모 느낌의 ";
        if (curl === 1) modification += isEn ? "curly " : "웨이브가 강한 펌 ";
        
        const baseName = result.name.split(' (')[0]; 
        const newTargetStyle = `${modification}${baseName} (${isEn ? 'Length' : '길이'}: ${getLengthLabel(length)}, ${isEn ? 'Curl' : '컬'}: ${getCurlLabel(curl)})`;
        
        // Pass gender/length from previous step if available, plus new color and language
        const updateOptions: AnalysisOptions = {
            gender: options?.gender || 'Male',
            currentLength: options?.currentLength || 'Short',
            targetColor: selectedColor === 'Original' ? undefined : selectedColor,
            language: lang as 'ko' | 'en'
        };

        const newResult = await analyzeHairStyle(userImage, newTargetStyle, updateOptions);
        setResult(newResult);
        setShowControls(false); 
        setActiveView('after');
        playSound('success');
    } catch (e) {
        console.error("Update failed", e);
        alert(isEn ? "Failed to update style. Please try again." : "스타일 변경에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
        setIsUpdating(false);
    }
  };

  const handleShare = async () => {
    playSound('click');
    if (result.imageUrl) {
        try {
            const blob = await (await fetch(result.imageUrl)).blob();
            const file = new File([blob], "hairstyle_result.png", { type: blob.type });

            if (navigator.share) {
                await navigator.share({
                    title: 'SafeCut AI Result',
                    text: isEn ? `Check out this style: "${result.name}"` : `이 스타일 어때요? "${result.name}"`,
                    files: [file],
                });
            } else {
                // Fallback for browsers without share API
                const link = document.createElement('a');
                link.href = result.imageUrl;
                link.download = 'hairstyle_result.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error("Share failed", error);
            // Fallback just in case
            const link = document.createElement('a');
            link.href = result.imageUrl;
            link.download = 'hairstyle_result.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
  };

  const getLengthLabel = (val: number) => {
      if (val === -1) return isEn ? "Short" : "짧게";
      if (val === 1) return isEn ? "Long" : "길게";
      return isEn ? "Medium" : "적당히";
  };

  const getCurlLabel = (val: number) => {
      if (val === -1) return isEn ? "Straight" : "단정하게";
      if (val === 1) return isEn ? "Volume" : "볼륨있게";
      return isEn ? "Natural" : "자연스럽게";
  };

  return (
    <div className="flex flex-col h-full p-6 animate-fade-in bg-slate-50 relative">
        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex justify-between items-center">
            <span>{isEn ? "AI Style Simulation" : "AI 스타일 시뮬레이션"}</span>
            <div className="flex gap-2">
                <button 
                    onClick={handleShare}
                    className="p-2 rounded-full bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    title={isEn ? "Share" : "공유하기"}
                >
                    <Share2 className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => setShowControls(!showControls)}
                    className={`p-2 rounded-full ${showControls ? 'bg-slate-200 text-slate-800' : 'bg-white text-slate-400 border border-slate-200'}`}
                >
                    <Settings2 className="w-5 h-5" />
                </button>
            </div>
        </h2>
        
        <div className="flex-1 bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 flex flex-col mb-4 relative">
            
            {/* Image Area with Toggle Click */}
            <div 
                className="relative w-full bg-slate-900 group select-none touch-none overflow-hidden" 
                style={{ height: showControls ? '50%' : '75%' }}
            >
                {isUpdating ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/10 backdrop-blur-sm animate-pulse">
                        <RefreshCcw className="w-10 h-10 text-slate-500 animate-spin mb-3" />
                        <span className="text-sm font-bold text-slate-600">{isEn ? "Updating Style..." : "스타일 조정 중..."}</span>
                    </div>
                ) : result.imageUrl ? (
                    <>
                         {/* Click Zones for intuitive toggling */}
                         <div className="absolute inset-0 z-20 flex">
                             <div 
                                className="w-1/2 h-full cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
                                onClick={() => setActiveView('before')}
                                title="Show Original"
                             />
                             <div 
                                className="w-1/2 h-full cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
                                onClick={() => setActiveView('after')}
                                title="Show Result"
                             />
                         </div>

                        {/* Images Stacked */}
                        {userImage && (
                            <img 
                                src={`data:image/jpeg;base64,${userImage}`} 
                                alt="Original" 
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${activeView === 'before' ? 'opacity-100' : 'opacity-0'}`}
                            />
                        )}
                        
                        <img 
                            src={result.imageUrl} 
                            alt={result.name} 
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${activeView === 'after' ? 'opacity-100' : 'opacity-0'}`}
                        />
                        
                        {/* Labels (Visual Indicators) */}
                        <div className={`absolute top-4 left-4 bg-black/60 text-white font-bold text-[10px] px-2 py-1 rounded backdrop-blur-sm border border-white/10 transition-opacity duration-300 pointer-events-none ${activeView === 'before' ? 'opacity-100' : 'opacity-0'}`}>
                            BEFORE
                        </div>

                        <div className={`absolute top-4 right-4 bg-primary/90 text-white font-bold text-[10px] px-2 py-1 rounded backdrop-blur-sm border border-white/20 transition-opacity duration-300 pointer-events-none ${activeView === 'after' ? 'opacity-100' : 'opacity-0'}`}>
                            AFTER
                        </div>

                        {/* Title Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent p-4 pt-12 pointer-events-none z-10">
                            <h1 className="text-xl font-bold text-white leading-tight drop-shadow-md">{result.name}</h1>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        {isEn ? "Failed to generate image" : "이미지 생성 실패"}
                    </div>
                )}
            </div>

            {/* Adjustment Controls (Conditional) */}
            {showControls ? (
                <div className="flex-1 bg-slate-50 p-5 flex flex-col animate-fade-in overflow-y-auto">
                     <div className="space-y-6 pb-4">
                        
                        {/* Color Picker */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-bold text-slate-500 flex items-center gap-1">
                                    <Palette className="w-3 h-3"/> {isEn ? "Color (Dye)" : "컬러 (염색)"}
                                </span>
                                <span className="text-sm font-bold text-primary">
                                    {isEn ? 
                                        (COLORS.find(c => c.name === selectedColor)?.labelEn || COLORS.find(c => c.name === selectedColor)?.label)
                                        : COLORS.find(c => c.name === selectedColor)?.label}
                                </span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {COLORS.map((color) => (
                                    <button
                                        key={color.name}
                                        onClick={() => setSelectedColor(color.name)}
                                        className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all
                                            ${selectedColor === color.name ? 'ring-2 ring-primary ring-offset-2 scale-110' : ''}
                                            ${color.border ? 'border border-slate-300' : ''}
                                        `}
                                        style={{ backgroundColor: color.hex }}
                                        title={isEn && color.labelEn ? color.labelEn : color.label}
                                    >
                                        {selectedColor === color.name && (
                                            <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                                        )}
                                        {color.name === 'Original' && (
                                            <span className="text-[10px] font-bold text-slate-500">{isEn ? 'Orig' : '기본'}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-bold text-slate-500">{isEn ? "Length" : "길이"}</span>
                                <span className="text-sm font-bold text-primary">{getLengthLabel(length)}</span>
                            </div>
                            <input 
                                type="range" min="-1" max="1" step="1"
                                value={length} onChange={(e) => setLength(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                                <span>{isEn ? "Short" : "짧게"}</span>
                                <span>{isEn ? "Med" : "적당히"}</span>
                                <span>{isEn ? "Long" : "길게"}</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-bold text-slate-500">{isEn ? "Curl" : "컬 (웨이브)"}</span>
                                <span className="text-sm font-bold text-primary">{getCurlLabel(curl)}</span>
                            </div>
                            <input 
                                type="range" min="-1" max="1" step="1"
                                value={curl} onChange={(e) => setCurl(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                                <span>{isEn ? "Flat" : "단정"}</span>
                                <span>{isEn ? "Natural" : "자연"}</span>
                                <span>{isEn ? "Curly" : "강하게"}</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleUpdateStyle}
                            className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            {isEn ? "Apply Style" : "스타일 적용하기"}
                        </button>
                     </div>
                </div>
            ) : (
                /* Standard Details View */
                <div className="p-5 flex-1 overflow-y-auto space-y-4 animate-fade-in bg-slate-50">
                     {/* FACE SHAPE ANALYSIS BUTTON */}
                     <button 
                        onClick={() => {
                            playSound('click');
                            setShowFaceAnalysis(true);
                        }}
                        className="w-full bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-between group hover:border-indigo-300 hover:shadow-md transition-all"
                     >
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-50 p-2.5 rounded-full text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                <ScanFace className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-sm font-bold text-slate-800">{isEn ? "AI Face Analysis" : "AI 얼굴형 분석 리포트"}</h3>
                                <p className="text-[11px] text-slate-500 font-medium">{isEn ? "Why this style fits you" : "내 얼굴형에 이 스타일이 어울리는 이유 보기"}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                     </button>

                     {/* PERSONAL COLOR BUTTON (NEW) */}
                     <button 
                        onClick={() => {
                            playSound('click');
                            setShowColorAnalysis(true);
                        }}
                        className="w-full bg-white p-4 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between group hover:border-rose-300 hover:shadow-md transition-all mt-3"
                     >
                        <div className="flex items-center gap-3">
                            <div className="bg-rose-50 p-2.5 rounded-full text-rose-600 group-hover:bg-rose-100 transition-colors">
                                <Palette className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-sm font-bold text-slate-800">{isEn ? "Personal Color" : "AI 퍼스널 컬러 진단"}</h3>
                                <p className="text-[11px] text-slate-500 font-medium">{isEn ? "Best hair colors for your skin tone" : "나에게 딱 맞는 염색 컬러 2가지 추천"}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-rose-400 transition-colors" />
                     </button>

                     {/* STYLING GUIDE BUTTON */}
                     <button 
                        onClick={() => {
                            playSound('click');
                            setShowStylingGuide(true);
                        }}
                        className="w-full bg-white p-4 rounded-2xl border border-orange-100 shadow-sm flex items-center justify-between group hover:border-orange-300 hover:shadow-md transition-all mt-3"
                     >
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-50 p-2.5 rounded-full text-orange-600 group-hover:bg-orange-100 transition-colors">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-sm font-bold text-slate-800">{isEn ? "Styling Guide" : "셀프 스타일링 가이드"}</h3>
                                <p className="text-[11px] text-slate-500 font-medium">{isEn ? "3-step home styling tips" : "집에서 혼자 손질하는 3단계 비법"}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-orange-400 transition-colors" />
                     </button>

                     {/* Order Script */}
                     <div className="p-4 bg-white rounded-2xl border border-teal-100 shadow-sm mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-bold text-teal-800 uppercase tracking-wider">{isEn ? "Order Script" : "미용사 전달 멘트"}</p>
                            <ShieldCheck className="w-4 h-4 text-teal-600" />
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line border-l-2 border-teal-200 pl-3">
                            "{result.description}"
                        </p>
                     </div>
                </div>
            )}
        </div>

        <button 
            onClick={handleRestart}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center space-x-2"
        >
            <RotateCcw className="w-5 h-5" />
            <span>{isEn ? "Start Over" : "처음으로 돌아가기"}</span>
        </button>
        {!showControls && (
             <button 
                onClick={() => setShowControls(true)}
                className="mt-3 w-full text-slate-400 text-sm py-2"
            >
                {isEn ? "Change length or color?" : "길이나 컬러를 바꾸고 싶으신가요?"}
            </button>
        )}

        {/* FACE ANALYSIS MODAL */}
        {showFaceAnalysis && (
            <div 
                className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
                onClick={(e) => {
                    if(e.target === e.currentTarget) setShowFaceAnalysis(false);
                }}
            >
                <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative animate-fade-in shadow-2xl mb-4 sm:mb-0">
                    <button 
                        onClick={() => setShowFaceAnalysis(false)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    <div className="flex flex-col items-center text-center mb-6 pt-2">
                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-indigo-600 shadow-inner">
                            <ScanFace className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{isEn ? "Face Shape Analysis" : "AI 얼굴형 분석"}</h3>
                        <p className="text-xs text-slate-400">Personalized Analysis</p>
                        {result.faceShape && (
                            <div className="mt-3 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md shadow-indigo-200">
                                {isEn ? `${result.faceShape} Detected` : `${result.faceShape} 감지됨`}
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6 text-left max-h-[40vh] overflow-y-auto">
                        <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                            {result.reason}
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => setShowFaceAnalysis(false)}
                        className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-transform"
                    >
                        {isEn ? "Got it" : "확인했습니다"}
                    </button>
                </div>
            </div>
        )}

        {/* PERSONAL COLOR MODAL */}
        {showColorAnalysis && (
            <div 
                className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
                onClick={(e) => {
                    if(e.target === e.currentTarget) setShowColorAnalysis(false);
                }}
            >
                <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative animate-fade-in shadow-2xl mb-4 sm:mb-0">
                    <button 
                        onClick={() => setShowColorAnalysis(false)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    <div className="flex flex-col items-center text-center mb-6 pt-2">
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 text-rose-600 shadow-inner">
                            <Palette className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{isEn ? "Personal Color" : "AI 퍼스널 컬러 진단"}</h3>
                        <p className="text-xs text-slate-400">Color Analysis & Recommendation</p>
                        {result.personalColor && (
                            <div className="mt-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md shadow-rose-200">
                                {result.personalColor}
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-4 mb-6">
                        {/* Reasoning */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 leading-snug">
                             {result.colorReason || (isEn ? "We analyzed your skin tone to find the best colors." : "사용자의 피부톤과 눈동자 색을 분석하여 가장 잘 어울리는 색상을 찾았습니다.")}
                        </div>

                        {/* Recommendations */}
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-4">Best Hair Colors</h4>
                        {result.recommendedColors && result.recommendedColors.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                {result.recommendedColors.map((color, idx) => (
                                    <div key={idx} className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col items-center text-center shadow-sm">
                                        <div 
                                            className="w-12 h-12 rounded-full shadow-inner mb-2 border-2 border-white ring-1 ring-slate-100"
                                            style={{ backgroundColor: color.hex }}
                                        />
                                        <span className="text-sm font-bold text-slate-800 mb-1">{color.name}</span>
                                        <span className="text-[10px] text-slate-500 leading-tight">{color.description}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 py-4">
                                {isEn ? "No color recommendations found." : "추천 색상 정보를 불러오지 못했습니다."}
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => setShowColorAnalysis(false)}
                        className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-transform"
                    >
                         {isEn ? "Got it" : "확인했습니다"}
                    </button>
                </div>
            </div>
        )}

        {/* STYLING GUIDE MODAL */}
        {showStylingGuide && (
            <div 
                className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
                onClick={(e) => {
                    if(e.target === e.currentTarget) setShowStylingGuide(false);
                }}
            >
                <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative animate-fade-in shadow-2xl mb-4 sm:mb-0">
                    <button 
                        onClick={() => setShowStylingGuide(false)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    <div className="flex flex-col items-center text-center mb-6 pt-2">
                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-orange-600 shadow-inner">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{isEn ? "Styling Guide" : "셀프 스타일링 가이드"}</h3>
                        <p className="text-xs text-slate-400">3-Step Home Styling</p>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                        {result.stylingTips && result.stylingTips.length > 0 ? (
                            result.stylingTips.map((tip, idx) => (
                                <div key={idx} className="flex gap-3 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                                    <div className="flex-shrink-0 w-6 h-6 bg-orange-200 text-orange-700 rounded-full flex items-center justify-center font-bold text-xs">
                                        {idx + 1}
                                    </div>
                                    <p className="text-sm text-slate-700 leading-snug">{tip}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-slate-400 py-4">
                                {isEn ? "No styling tips available." : "스타일링 정보가 없습니다."}
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => setShowStylingGuide(false)}
                        className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-transform"
                    >
                         {isEn ? "I'll try it" : "따라해볼게요"}
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default ResultCard;