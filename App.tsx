import React, { useState, useEffect } from 'react';
import { AppStep, StyleRecommendation, AnalysisOptions } from './types';
import AnalysisStep from './components/AnalysisStep';
import ResultCard from './components/ResultCard';
import { Scissors, User, UserCheck, X, Lock, Gift, Sparkles, MessageCircle } from 'lucide-react';
import { playSound } from './utils/audio';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.WELCOME);
  const [result, setResult] = useState<StyleRecommendation | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions | undefined>(undefined);
  
  // Language State for Welcome Screen
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const isEn = lang === 'en';
  
  // Gender State for Modal
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'Male' | 'Female'>('Female');

  // Usage Limit State
  const [usageCount, setUsageCount] = useState(0);
  const [extraCredits, setExtraCredits] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // CHANGED: Daily limit reduced from 3 to 1
  const MAX_DAILY_LIMIT = 1;

  useEffect(() => {
    // Initialize Usage Stats from LocalStorage
    const today = new Date().toISOString().split('T')[0];
    const storedDate = localStorage.getItem('safecut_date');
    const storedCount = localStorage.getItem('safecut_usage');
    const storedCredits = localStorage.getItem('safecut_credits');

    if (storedDate !== today) {
        // Reset if new day
        localStorage.setItem('safecut_date', today);
        localStorage.setItem('safecut_usage', '0');
        setUsageCount(0);
    } else {
        setUsageCount(parseInt(storedCount || '0', 10));
    }

    if (storedCredits) {
        setExtraCredits(parseInt(storedCredits, 10));
    }
  }, []);

  const checkUsageLimit = (): boolean => {
      if (usageCount < (MAX_DAILY_LIMIT + extraCredits)) {
          return true;
      }
      playSound('hover'); // Warning sound
      setShowLimitModal(true);
      return false;
  };

  const incrementUsage = () => {
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      localStorage.setItem('safecut_usage', newCount.toString());
  };

  const handleInviteFriend = () => {
      playSound('click');
      // Simulate invite sharing with Web Share API (supports KakaoTalk natively on mobile)
      const shareData = {
          title: 'SafeCut AI',
          text: isEn ? 'Check out this AI hairstyle app!' : '머리 자르기 전에 필수! AI로 내 인생 머리 미리 확인해봐. #SafeCutAI',
          url: window.location.href
      };

      if (navigator.share) {
          navigator.share(shareData)
              .then(() => {
                  grantCredits();
              })
              .catch((e) => {
                  console.log('Share cancelled', e);
                  // 낙관적 UI: 공유 창을 열었다가 취소해도 의도를 인정하여 크레딧 지급 (UX friction 감소)
                  grantCredits(); 
              });
      } else {
          // Fallback for desktop
          navigator.clipboard.writeText(window.location.href);
          alert(isEn ? "Link copied! Send it to a friend." : "초대 링크가 복사되었습니다! 친구에게 붙여넣기 해주세요.");
          grantCredits();
      }
  };

  const grantCredits = () => {
      // CHANGED: Grant +1 credit instead of +2
      const newCredits = extraCredits + 1;
      setExtraCredits(newCredits);
      localStorage.setItem('safecut_credits', newCredits.toString());
      playSound('success');
      // Alert removed to make it smoother, just close modal and proceed
      setShowLimitModal(false);
  };

  const handleAnalysisComplete = (data: StyleRecommendation, image: string | null, options: AnalysisOptions) => {
    incrementUsage(); // Deduct credit on success
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
    setShowGenderModal(false);
  };

  const handleStart = () => {
      setShowGenderModal(true);
  };

  const selectGenderAndProceed = (gender: 'Male' | 'Female') => {
      setSelectedGender(gender);
      setShowGenderModal(false);
      setStep(AppStep.ANALYSIS);
  };

  const renderContent = () => {
    switch (step) {
      case AppStep.WELCOME:
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in relative z-10">
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

            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-8 shadow-inner">
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
            
            {/* Usage Badge */}
            <div className="mb-6 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-slate-600">
                    {isEn ? `Free Left: ${(MAX_DAILY_LIMIT + extraCredits) - usageCount}` : `남은 무료 횟수: ${(MAX_DAILY_LIMIT + extraCredits) - usageCount}회`}
                </span>
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-transform"
            >
              {lang === 'ko' ? "거울 보고 시작하기" : "Start with Camera"}
            </button>
          </div>
        );
      case AppStep.ANALYSIS:
        return (
            <AnalysisStep 
                onComplete={handleAnalysisComplete} 
                lang={lang} 
                gender={selectedGender} 
                onHome={handleReset} 
                checkLimit={checkUsageLimit}
            />
        );
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
    // Main app container
    <div className="max-w-md mx-auto h-full bg-slate-50 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 z-10">
        <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
        />
      </div>
      
      {renderContent()}

      {/* Gender Selection Modal */}
      {showGenderModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-fade-in">
              <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] flex flex-col items-center relative">
                  <button 
                      onClick={() => setShowGenderModal(false)}
                      className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"
                  >
                      <X className="w-6 h-6" />
                  </button>

                  <h2 className="text-2xl font-bold text-white mb-2">{lang === 'ko' ? "성별 선택" : "Select Gender"}</h2>
                  <p className="text-white/60 text-sm mb-8 text-center">{lang === 'ko' ? "정확한 AI 분석을 위해 선택해주세요." : "Please select for accurate AI analysis."}</p>

                  <div className="w-full space-y-4">
                      <button 
                          onClick={() => selectGenderAndProceed('Female')}
                          className="w-full h-16 rounded-2xl bg-gradient-to-r from-orange-500/80 to-pink-500/80 hover:from-orange-500 hover:to-pink-500 border border-white/20 shadow-lg flex items-center justify-center space-x-3 text-white font-bold text-lg active:scale-95 transition-all"
                      >
                          <User className="w-6 h-6" />
                          <span>{lang === 'ko' ? "여성 (Female)" : "Female"}</span>
                      </button>

                      <button 
                          onClick={() => selectGenderAndProceed('Male')}
                          className="w-full h-16 rounded-2xl bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-600 hover:to-indigo-600 border border-white/20 shadow-lg flex items-center justify-center space-x-3 text-white font-bold text-lg active:scale-95 transition-all"
                      >
                          <UserCheck className="w-6 h-6" />
                          <span>{lang === 'ko' ? "남성 (Male)" : "Male"}</span>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* LIMIT REACHED / INVITE MODAL - LIQUID GLASS STYLE */}
      {showLimitModal && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
               <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] flex flex-col items-center text-center relative overflow-hidden">
                    
                    {/* Decorative Glow */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/30 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-pink-500/30 rounded-full blur-3xl pointer-events-none"></div>

                    <button 
                        onClick={() => setShowLimitModal(false)}
                        className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors z-10"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 border border-white/20 relative shadow-inner">
                        <Lock className="w-10 h-10 text-orange-200" />
                        <div className="absolute top-0 right-0 bg-red-500 w-5 h-5 rounded-full border-2 border-slate-900 shadow-md"></div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                        {isEn ? "Daily Limit Reached" : "오늘 무료 횟수 마감"}
                    </h2>
                    <p className="text-white/70 text-sm mb-8 leading-relaxed">
                        {isEn ? 
                            "Invite a friend and get +1 free credit instantly!" : 
                            "친구에게 소개하고\n+1회 추가 이용권을 바로 받으세요!"}
                    </p>

                    {/* Kakao Style Button */}
                    <button 
                        onClick={handleInviteFriend}
                        className="w-full py-4 bg-[#FEE500] hover:bg-[#FDD835] rounded-2xl text-[#3C1E1E] font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 relative z-10"
                    >
                        <MessageCircle className="w-6 h-6 fill-[#3C1E1E]" />
                        <span>{isEn ? "Invite via KakaoTalk" : "카카오톡으로 초대하기"}</span>
                    </button>
                    
                    <div className="mt-4 flex items-center gap-2">
                        <Gift className="w-4 h-4 text-pink-400" />
                        <p className="text-[11px] text-pink-200">
                            {isEn ? "Reward applied immediately after sharing" : "공유만 해도 즉시 지급됩니다"}
                        </p>
                    </div>
               </div>
          </div>
      )}
    </div>
  );
};

export default App;