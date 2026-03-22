'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { MONTHS } from '@/lib/constants';

const FORM_STEPS = [
  { id: 'basic', title: 'Основная информация', icon: '📝' },
  { id: 'details', title: 'Описание и фото', icon: '📸' },
  { id: 'practical', title: 'Практические детали', icon: '⚙️' },
];

const PLACE_TYPE_OPTIONS = [
  { value: 'farm', label: 'Ферма' },
  { value: 'winery', label: 'Винодельня' },
  { value: 'guesthouse', label: 'Гостевой дом' },
  { value: 'craft', label: 'Мастерская' },
  { value: 'nature', label: 'Природный маршрут' },
  { value: 'restaurant', label: 'Ресторан / кафе' },
  { value: 'other', label: 'Прочее' },
];

const AUDIENCE_TAGS = [
  { value: 'child_friendly', label: 'Для семей с детьми' },
  { value: 'elderly_friendly', label: 'Для пожилых' },
  { value: 'couples', label: 'Для пар' },
  { value: 'solo', label: 'Для одиночных путешественников' },
  { value: 'groups', label: 'Для групп / компаний' },
  { value: 'remote_workers', label: 'Для удалёнщиков' },
  { value: 'pet_friendly', label: 'Можно с животными' },
  { value: 'disabled_access', label: 'Доступная среда' },
];

export default function BusinessPage() {
  const [formStep, setFormStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    address: '',
    short_description: '',
    seasons: [],
    price: '',
    is_free: false,
    phone: '',
    website: '',
    has_public_transport: false,
    audience_tags: [],
    email: '',
    comments: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const toggleArrayField = (field, value) => {
    const arr = formData[field] || [];
    const next = arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
    updateField(field, next);
  };

  const validateStep = () => {
    const newErrors = {};

    if (formStep === 0) {
      if (!formData.name.trim()) newErrors.name = 'Введите название';
      if (!formData.type) newErrors.type = 'Выберите тип';
      if (!formData.address.trim()) newErrors.address = 'Введите адрес';
    } else if (formStep === 1) {
      if (!formData.short_description.trim()) newErrors.short_description = 'Введите описание';
      if (formData.short_description.length > 500) newErrors.short_description = 'Максимум 500 символов';
    } else if (formStep === 2) {
      if (!formData.email.trim()) newErrors.email = 'Введите email';
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Некорректный email';
      if (formData.seasons.length === 0) newErrors.seasons = 'Выберите хотя бы один месяц';
      if (!formData.is_free && !formData.price) newErrors.price = 'Укажите цену или отметьте «Бесплатно»';
      if (formData.audience_tags.length === 0) newErrors.audience_tags = 'Выберите хотя бы одну аудиторию';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (formStep < FORM_STEPS.length - 1) {
        setFormStep(formStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    // In real app, would POST to /api/business/submit
    console.log('Submitting:', formData);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-cream-100 flex items-center justify-center pt-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 max-w-lg mx-4 text-center"
          >
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="font-display text-2xl font-bold text-forest-800 mb-4">
              Спасибо! Заявка отправлена
            </h2>
            <p className="text-forest-600/70 leading-relaxed mb-8">
              Ваше место будет проверено в течение 24 часов.
              После одобрения оно появится в маршрутах для туристов.
            </p>
            <a href="/" className="btn-primary">
              Вернуться на главную
            </a>
          </motion.div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="min-h-screen bg-cream-100 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-forest-800 mb-3">
              Добавить своё место
            </h1>
            <p className="text-forest-600/70 text-lg">
              Расскажите о вашем месте — и туристы найдут вас через АвтоРитм
            </p>
          </motion.div>

          {/* Progress */}
          <div className="flex items-center justify-between mb-10">
            {FORM_STEPS.map((step, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`
                  flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all
                  ${i === formStep
                    ? 'bg-terracotta-500 text-white shadow-md'
                    : i < formStep
                    ? 'bg-forest-100 text-forest-700'
                    : 'bg-cream-200 text-forest-400'
                  }
                `}>
                  <span>{step.icon}</span>
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
                {i < FORM_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${i < formStep ? 'bg-forest-300' : 'bg-cream-300'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="glass-card p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={formStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {formStep === 0 && (
                  <div className="space-y-6">
                    <FormField label="Название места" error={errors.name} required>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="Например: Винодельня «Шато Тамань»"
                        className="form-input"
                      />
                    </FormField>

                    <FormField label="Тип места" error={errors.type} required>
                      <div className="grid grid-cols-2 gap-2">
                        {PLACE_TYPE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => updateField('type', opt.value)}
                            className={`
                              p-3 rounded-xl text-sm font-medium text-left transition-all border-2
                              ${formData.type === opt.value
                                ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700'
                                : 'border-cream-200 bg-white text-forest-600 hover:border-terracotta-300'
                              }
                            `}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </FormField>

                    <FormField label="Адрес" error={errors.address} required>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        placeholder="Полный адрес или координаты"
                        className="form-input"
                      />
                    </FormField>
                  </div>
                )}

                {formStep === 1 && (
                  <div className="space-y-6">
                    <FormField
                      label="Краткое описание"
                      error={errors.short_description}
                      hint={`${formData.short_description.length}/500 символов`}
                      required
                    >
                      <textarea
                        value={formData.short_description}
                        onChange={(e) => updateField('short_description', e.target.value)}
                        rows={5}
                        maxLength={500}
                        placeholder="Опишите, что ждёт посетителя. Пишите живо, от первого лица — будто рассказываете другу."
                        className="form-input resize-none"
                      />
                    </FormField>

                    <FormField label="Фотографии" hint="До 5 фото, JPG/PNG, макс. 5 МБ">
                      <div className="border-2 border-dashed border-cream-300 rounded-xl p-8 text-center hover:border-terracotta-300 transition-colors cursor-pointer">
                        <div className="text-4xl mb-2">📸</div>
                        <p className="text-forest-600/70 text-sm">
                          Нажмите для загрузки фотографий
                        </p>
                        <p className="text-forest-500/50 text-xs mt-1">
                          Функция будет доступна при подключении бэкенда
                        </p>
                      </div>
                    </FormField>
                  </div>
                )}

                {formStep === 2 && (
                  <div className="space-y-6">
                    <FormField label="Сезонность" error={errors.seasons} required>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {MONTHS.map((month, i) => (
                          <button
                            key={i}
                            onClick={() => toggleArrayField('seasons', i + 1)}
                            className={`
                              p-2 rounded-lg text-xs font-medium transition-all border
                              ${formData.seasons.includes(i + 1)
                                ? 'border-forest-500 bg-forest-500 text-white'
                                : 'border-cream-300 bg-white text-forest-600 hover:border-forest-300'
                              }
                            `}
                          >
                            {month.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </FormField>

                    <FormField label="Стоимость" error={errors.price}>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.is_free}
                            onChange={(e) => updateField('is_free', e.target.checked)}
                            className="w-4 h-4 rounded border-cream-300 text-terracotta-500 focus:ring-terracotta-500"
                          />
                          <span className="text-sm text-forest-700">Бесплатно</span>
                        </label>
                        {!formData.is_free && (
                          <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => updateField('price', e.target.value)}
                            placeholder="Цена в ₽"
                            className="form-input flex-1"
                          />
                        )}
                      </div>
                    </FormField>

                    <FormField label="Доступ без машины">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.has_public_transport}
                          onChange={(e) => updateField('has_public_transport', e.target.checked)}
                          className="w-4 h-4 rounded border-cream-300 text-terracotta-500 focus:ring-terracotta-500"
                        />
                        <span className="text-sm text-forest-700">
                          Можно добраться на общественном транспорте
                        </span>
                      </label>
                    </FormField>

                    <FormField label="Целевая аудитория" error={errors.audience_tags} required>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {AUDIENCE_TAGS.map((tag) => (
                          <button
                            key={tag.value}
                            onClick={() => toggleArrayField('audience_tags', tag.value)}
                            className={`
                              p-2.5 rounded-xl text-sm font-medium text-left transition-all border
                              ${formData.audience_tags.includes(tag.value)
                                ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700'
                                : 'border-cream-200 bg-white text-forest-600 hover:border-terracotta-300'
                              }
                            `}
                          >
                            {tag.label}
                          </button>
                        ))}
                      </div>
                    </FormField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Телефон">
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => updateField('phone', e.target.value)}
                          placeholder="+7 (___) ___-__-__"
                          className="form-input"
                        />
                      </FormField>
                      <FormField label="Сайт">
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => updateField('website', e.target.value)}
                          placeholder="https://"
                          className="form-input"
                        />
                      </FormField>
                    </div>

                    <FormField label="Email для связи" error={errors.email} required>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="email@example.com"
                        className="form-input"
                      />
                      <p className="text-xs text-forest-500/50 mt-1">
                        Не отображается публично
                      </p>
                    </FormField>

                    <FormField label="Дополнительные комментарии">
                      <textarea
                        value={formData.comments}
                        onChange={(e) => updateField('comments', e.target.value)}
                        rows={3}
                        placeholder="Что ещё стоит знать о вашем месте?"
                        className="form-input resize-none"
                      />
                    </FormField>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-cream-200">
              {formStep > 0 ? (
                <button
                  onClick={() => setFormStep(formStep - 1)}
                  className="text-forest-600 hover:text-forest-800 font-medium text-sm transition-colors"
                >
                  ← Назад
                </button>
              ) : (
                <div />
              )}
              <button onClick={handleNext} className="btn-primary text-sm py-2.5 px-8">
                {formStep === FORM_STEPS.length - 1 ? '✅ Отправить заявку' : 'Далее →'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

function FormField({ label, error, hint, required, children }) {
  return (
    <div>
      <label className="block mb-2">
        <span className="text-sm font-semibold text-forest-800">
          {label}
          {required && <span className="text-terracotta-500 ml-0.5">*</span>}
        </span>
        {hint && <span className="text-xs text-forest-500/50 ml-2">{hint}</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>
      )}

      <style jsx global>{`
        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid #FFE0C5;
          border-radius: 0.75rem;
          background: white;
          font-size: 0.875rem;
          color: #2A2A2A;
          transition: all 0.2s;
          outline: none;
        }
        .form-input:focus {
          border-color: #C75B39;
          box-shadow: 0 0 0 3px rgba(199, 91, 57, 0.1);
        }
        .form-input::placeholder {
          color: #9CA3AF;
        }
      `}</style>
    </div>
  );
}
