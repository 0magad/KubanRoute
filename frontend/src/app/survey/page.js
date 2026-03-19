'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SURVEY_STEPS } from '@/lib/constants';
import { generateRoute } from '@/lib/api';

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export default function SurveyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [direction, setDirection] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Restore from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('kubanroute_survey');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(parsed.answers || {});
        setCurrentStep(parsed.step || 0);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Save to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(
      'kubanroute_survey',
      JSON.stringify({ answers, step: currentStep })
    );
  }, [answers, currentStep]);

  const step = SURVEY_STEPS[currentStep];
  const isMulti = step.type === 'multi';
  const currentAnswer = answers[step.id];
  const isStepValid = isMulti
    ? Array.isArray(currentAnswer) && currentAnswer.length > 0
    : currentAnswer !== undefined;

  const handleSelect = useCallback(
    (value) => {
      if (isMulti) {
        const prev = Array.isArray(answers[step.id]) ? answers[step.id] : [];
        const next = prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value];
        setAnswers({ ...answers, [step.id]: next });
      } else {
        setAnswers({ ...answers, [step.id]: value });
      }
    },
    [answers, step.id, isMulti]
  );

  const handleNext = async () => {
    if (currentStep < SURVEY_STEPS.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else {
      // Last step — generate route
      setIsGenerating(true);
      try {
        const profile = {
          group_type: answers.group_type,
          days: answers.days,
          budget: answers.budget,
          interests: answers.interests,
          transport: answers.transport,
        };

        const result = await generateRoute(profile);

        // Store result for the route page
        sessionStorage.setItem('kubanroute_result', JSON.stringify(result));
        sessionStorage.removeItem('kubanroute_survey');

        router.push(`/route/${result.share_token || 'demo123'}`);
      } catch (error) {
        console.error('Generation failed:', error);
        setIsGenerating(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    } else {
      router.push('/');
    }
  };

  if (isGenerating) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 via-white to-cream-200 flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-cream-300/50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={handleBack}
              className="text-forest-600 hover:text-forest-800 transition-colors font-medium text-sm flex items-center gap-1"
            >
              ← {currentStep === 0 ? 'На главную' : 'Назад'}
            </button>
            <span className="text-sm text-forest-600/60 font-medium">
              {currentStep + 1} из {SURVEY_STEPS.length}
            </span>
          </div>
          <div className="h-1.5 bg-forest-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-terracotta-500 to-gold-400 rounded-full"
              initial={false}
              animate={{ width: `${((currentStep + 1) / SURVEY_STEPS.length) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-32">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              {/* Question */}
              <div className="text-center mb-10">
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-forest-800 mb-3">
                  {step.question}
                </h1>
                <p className="text-forest-600/70 text-lg">{step.description}</p>
                {isMulti && (
                  <p className="text-terracotta-500 text-sm mt-2 font-medium">
                    Можно выбрать несколько вариантов
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {step.options.map((option) => {
                  const isSelected = isMulti
                    ? Array.isArray(currentAnswer) && currentAnswer.includes(option.value)
                    : currentAnswer === option.value;

                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        relative p-5 rounded-2xl border-2 text-left transition-all duration-200
                        ${
                          isSelected
                            ? 'border-terracotta-500 bg-terracotta-50 shadow-lg shadow-terracotta-500/10'
                            : 'border-cream-300 bg-white hover:border-terracotta-300 hover:bg-cream-50 shadow-sm'
                        }
                      `}
                    >
                      {/* Check indicator */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 w-6 h-6 bg-terracotta-500 rounded-full flex items-center justify-center"
                        >
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}

                      <div className="flex items-start gap-4">
                        <span className="text-3xl flex-shrink-0">{option.icon}</span>
                        <div>
                          <h3 className={`font-semibold text-base ${isSelected ? 'text-terracotta-700' : 'text-forest-800'}`}>
                            {option.label}
                          </h3>
                          <p className={`text-sm mt-0.5 ${isSelected ? 'text-terracotta-600/70' : 'text-forest-600/60'}`}>
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-cream-300/50 p-4">
        <div className="max-w-2xl mx-auto">
          <motion.button
            onClick={handleNext}
            disabled={!isStepValid}
            whileHover={isStepValid ? { scale: 1.02 } : {}}
            whileTap={isStepValid ? { scale: 0.98 } : {}}
            className={`
              w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300
              ${
                isStepValid
                  ? 'bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white shadow-lg shadow-terracotta-500/30 hover:shadow-xl'
                  : 'bg-cream-200 text-forest-400 cursor-not-allowed'
              }
            `}
          >
            {currentStep === SURVEY_STEPS.length - 1
              ? '✨ Сгенерировать маршрут'
              : 'Далее →'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading screen shown during route generation
 */
function LoadingScreen() {
  const [hintIndex, setHintIndex] = useState(0);
  const hints = [
    'Подбираем лучшие места для вас…',
    'Изучаем виноградники Тамани…',
    'Проверяем расписание фестивалей…',
    'Строим оптимальный маршрут…',
    'Выбираем уютные гостевые дома…',
    'Рассчитываем время в пути…',
    'Добавляем атмосферные описания…',
    'Почти готово! Финальные штрихи…',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % hints.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [hints.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-800 via-forest-700 to-forest-900 flex items-center justify-center">
      <div className="text-center px-4">
        {/* Animated map icon */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-terracotta-500/20 rounded-full animate-ping" />
          <div className="absolute inset-4 bg-terracotta-500/30 rounded-full animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl animate-float">🗺️</span>
          </div>
          {/* Orbiting dots */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-gold-400 rounded-full"
              animate={{
                x: [0, 50 * Math.cos((i * 120 * Math.PI) / 180), 0],
                y: [0, 50 * Math.sin((i * 120 * Math.PI) / 180), 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
              }}
              style={{ top: '50%', left: '50%' }}
            />
          ))}
        </div>

        {/* Title */}
        <h2 className="font-display text-2xl font-bold text-white mb-4">
          Создаём ваш маршрут
        </h2>

        {/* Loading dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 bg-terracotta-400 rounded-full loading-dot"
            />
          ))}
        </div>

        {/* Rotating hint */}
        <AnimatePresence mode="wait">
          <motion.p
            key={hintIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-white/60 text-lg"
          >
            {hints[hintIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
