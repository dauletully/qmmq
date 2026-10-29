import type { TextFieldSingleValidation } from 'payload'

// Валидаторы полей админки. Возвращают true или текст ошибки по-русски.

export const validateUrl: TextFieldSingleValidation = (value) => {
  if (!value) return true
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error()
    return true
  } catch {
    return 'Введите полную ссылку, начиная с https://'
  }
}

export const validateSlug: TextFieldSingleValidation = (value) => {
  if (!value) return 'Обязательное поле'
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
    ? true
    : 'Только латинские строчные буквы, цифры и дефис, например contest-2026'
}

export const validateOptionalPhone: TextFieldSingleValidation = (value) => {
  if (!value) return true
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
    ? true
    : 'Номер в международном формате, например +7 701 123 45 67'
}

export const validateEmail: TextFieldSingleValidation = (value) => {
  if (!value) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? true : 'Проверьте e-mail'
}

// Meta Pixel ID — только цифры (обычно 15–16).
export const validateMetaPixelId: TextFieldSingleValidation = (value) => {
  if (!value) return true
  return /^\d{10,20}$/.test(value.trim())
    ? true
    : 'ID пикселя Meta — только цифры (обычно 15–16), например 123456789012345. Вставьте сам ID, а не код пикселя.'
}

// TikTok Pixel ID — латинские заглавные буквы и цифры (обычно 20 символов, начинается с C).
export const validateTiktokPixelId: TextFieldSingleValidation = (value) => {
  if (!value) return true
  return /^[A-Z0-9]{16,24}$/.test(value.trim())
    ? true
    : 'ID пикселя TikTok — латинские заглавные буквы и цифры (обычно 20 символов), например CABCDEFGHIJ1234567KL. Вставьте сам ID, а не код пикселя.'
}

export const validateAmoBaseUrl: TextFieldSingleValidation = (value) => {
  if (!value) return true
  try {
    const url = new URL(value)
    // Локальная заглушка amoCRM для разработки.
    if (process.env.NODE_ENV !== 'production' && /^(localhost|127\.0\.0\.1)$/.test(url.hostname)) {
      return true
    }
    if (url.protocol !== 'https:') return 'Адрес должен начинаться с https://'
    if (!/\.(amocrm\.ru|amocrm\.com|kommo\.com)$/.test(url.hostname)) {
      return 'Адрес аккаунта вида https://school.amocrm.ru'
    }
    return true
  } catch {
    return 'Адрес аккаунта вида https://school.amocrm.ru'
  }
}
