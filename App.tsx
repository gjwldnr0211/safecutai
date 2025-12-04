import React, { useState } from 'react';
import { AppStep, StyleRecommendation, AnalysisOptions } from './types';
import AnalysisStep from './components/AnalysisStep';
import ResultCard from './components/ResultCard';
import { Scissors, Globe } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.WELCOME);
  const [result, setResult] = useState<StyleRecommendation | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions | undefined>(undefined);
  
  // Language State for Welcome Screen
  const [lang, setLang] = useState<'ko' | 'en'>('ko');

  const handleAnalysisComplete = (data: StyleRecommendation, image: string | null, options: AnalysisOptions) => {
    setResult(data);
    setUserImage(image);
    setAnalysisOptions(options);
    setStep(AppStep.RESULT);
  };

  const handleReset = () => {
    setResult(null);
    setUserImage(null);
    setAnalysisOptions(undefined);
    setStep(AppStep.WELCOME);
  };

  const renderContent = () => {
    switch (step) {
      case AppStep.WELCOME:
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in relative">
            {/* Language Toggle */}
            <div className="absolute top-6 right-6 flex bg-slate-200 p-1 rounded-full shadow-inner">
                <button 
                    onClick={() => setLang('ko')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${lang === 'ko' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    KO
                </button>
                <button 
                    onClick={() => setLang('en')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${lang === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    EN
                </button>
            </div>

            <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mb-8 shadow-inner">
                <Scissors className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">SafeCut AI</h1>
            <p className="text-lg text-slate-600 mb-8 font-light">
              {lang === 'ko' ? (
                  <>
                    나에게 딱 맞는 헤어스타일,<br/>
                    AI가 미리 찾아드립니다.<br/>
                    <span className="font-bold text-primary">스마트한 헤어 시뮬레이션</span>
                  </>
              ) : (
                  <>
                    Find your perfect hairstyle<br/>
                    before you cut.<br/>
                    <span className="font-bold text-primary">Smart Hair Simulation</span>
                  </>
              )}
            </p>
            <button
              onClick={() => setStep(AppStep.ANALYSIS)}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-transform"
            >
              {lang === 'ko' ? "거울 보고 시작하기" : "Start with Camera"}
            </button>
            <p className="mt-4 text-xs text-slate-400">
                {lang === 'ko' ? (
                    <>카메라를 통해 내 얼굴형에 맞는<br/>최적의 스타일을 디자인해드립니다.</>
                ) : (
                    <>We design the optimal style for your<br/>face shape using the camera.</>
                )}
            </p>
          </div>
        );
      case AppStep.ANALYSIS:
        return <AnalysisStep onComplete={handleAnalysisComplete} lang={lang} />;
      case AppStep.RESULT:
        return result && (
            <ResultCard 
                recommendations={result} 
                userImage={userImage} 
                onSelect={handleReset} 
                options={analysisOptions}
                lang={lang} 
            />
        );
      default:
        return null;
    }
  };

  return (
    // Main app container - using h-full to support mobile webview constraints
    <div className="max-w-md mx-auto h-full bg-slate-50 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 z-10">
        <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
        />
      </div>
      {renderContent()}
    </div>
  );
};

export default App;