import type { Locale } from '../constants'

// Тексты для ключей ошибок из schemas.ts и ответов API форм. Вёрстка может переопределить.
export const FORM_ERROR_MESSAGES: Record<string, Record<Locale, string>> = {
  required: { ru: 'Заполните поле', kk: 'Өрісті толтырыңыз' },
  too_short: { ru: 'Слишком коротко', kk: 'Тым қысқа' },
  too_long: { ru: 'Слишком длинно', kk: 'Тым ұзын' },
  too_small: { ru: 'Слишком маленькое число', kk: 'Сан тым аз' },
  too_large: { ru: 'Слишком большое число', kk: 'Сан тым үлкен' },
  invalid_value: { ru: 'Проверьте значение', kk: 'Мәнді тексеріңіз' },
  invalid_number: { ru: 'Введите число', kk: 'Санды енгізіңіз' },
  invalid_phone: {
    ru: 'Проверьте номер: +7 и 10 цифр',
    kk: 'Нөмірді тексеріңіз: +7 және 10 сан',
  },
  invalid_email: { ru: 'Проверьте e-mail', kk: 'E-mail мекенжайын тексеріңіз' },
  invalid_option: { ru: 'Выберите вариант из списка', kk: 'Тізімнен таңдаңыз' },
  consent_required: {
    ru: 'Нужно согласие на обработку данных',
    kk: 'Деректерді өңдеуге келісім қажет',
  },
  too_fast: {
    ru: 'Форма отправлена слишком быстро. Попробуйте ещё раз',
    kk: 'Форма тым жылдам жіберілді. Қайталап көріңіз',
  },
  rate_limited: {
    ru: 'Слишком много попыток. Попробуйте через несколько минут',
    kk: 'Әрекет тым көп. Бірнеше минуттан соң қайталаңыз',
  },
  server_error: {
    ru: 'Не удалось отправить. Попробуйте ещё раз или напишите нам в WhatsApp',
    kk: 'Жіберу мүмкін болмады. Қайталап көріңіз немесе WhatsApp-қа жазыңыз',
  },
}

export function formErrorMessage(key: string, locale: Locale = 'ru'): string {
  const m = FORM_ERROR_MESSAGES[key] ?? FORM_ERROR_MESSAGES.invalid_value
  return m[locale] || m.ru
}
