import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Star, ChevronLeft, Loader2, ExternalLink } from 'lucide-react';
import { findNearbySalons } from '../services/geminiService';
import { playSound } from '../utils/audio';

interface Props {
  styleName: string;
  onBack: () => void;
}

const SalonFinder: React.FC<Props> = ({ styleName, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ text: string, chunks: any[] } | null>(null);

  useEffect(() => {
    // 1. Get Location
    if (!navigator.geolocation) {
        setError("브라우저가 위치 정보를 지원하지 않습니다.");
        setLoading(false);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                // 2. Call Gemini API
                const data = await findNearbySalons(
                    position.coords.latitude,
                    position.coords.longitude,
                    styleName
                );
                setResult(data);
            } catch (err) {
                setError("미용실 정보를 가져오는 중 오류가 발생했습니다.");
            } finally {
                setLoading(false);
            }
        },
        (err) => {
            console.error(err);
            setError("위치 권한이 필요합니다. 설정에서 위치 권한을 허용해주세요.");
            setLoading(false);
        }
    );
  }, [styleName]);

  const handleBack = () => {
    playSound('click');
    onBack();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
        {/* Header */}
        <div className="bg-white p-4 shadow-sm flex items-center gap-2 z-10">
            <button onClick={handleBack} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                내 주변 미용실 찾기
            </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="relative">
                         <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
                         <MapPin className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">위치 분석 중...</h3>
                        <p className="text-sm text-slate-500">"{styleName}" 스타일을 잘하는<br/>근처 미용실을 찾고 있습니다.</p>
                    </div>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <Navigation className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-slate-600 font-medium mb-4">{error}</p>
                    <button onClick={handleBack} className="bg-primary text-white px-6 py-2 rounded-xl shadow-lg">
                        돌아가기
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Intro */}
                    <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
                        <p className="text-sm text-teal-800 font-medium leading-relaxed">
                            {result?.text.split('\n')[0]} {/* Show just the intro summary */}
                        </p>
                    </div>

                    {/* Salon List (From Grounding Chunks) */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            추천 플레이스
                        </h3>
                        
                        {result?.chunks && result.chunks.length > 0 ? (
                            result.chunks.map((chunk: any, idx: number) => {
                                if (chunk.maps) {
                                    return (
                                        <a 
                                            key={idx}
                                            href={chunk.maps.uri}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-primary hover:shadow-md transition-all group"
                                            onClick={() => playSound('click')}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">
                                                        {chunk.maps.title}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        지도에서 위치 보기
                                                    </p>
                                                </div>
                                                <ExternalLink className="w-5 h-5 text-slate-300 group-hover:text-primary" />
                                            </div>
                                        </a>
                                    );
                                }
                                return null;
                            })
                        ) : (
                            <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-slate-300">
                                <p className="text-sm text-slate-500">
                                    추천된 미용실의 세부 정보를 불러오지 못했습니다.<br/>
                                    아래 텍스트 결과를 참고해주세요.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Full Analysis Text */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="font-bold text-xs text-slate-500 mb-3 uppercase">상세 분석 내용</h4>
                        <div className="text-sm text-slate-700 leading-7 whitespace-pre-wrap">
                            {result?.text}
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default SalonFinder;