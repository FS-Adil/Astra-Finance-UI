// Моковые данные для офлайн-режима
export const mockUsers = [
  { login: "user", password: "user123", role: "user" },
  { login: "admin", password: "admin123", role: "admin" },
  { login: "operator", password: "operator123", role: "operator" }
];

export const mockCalculationData = {
  tab1: {
    result: "Расчет для вкладки 1: 125 000 руб.",
    details: "Детальный расчет за выбранный период",
    organization: "ООО 'Ромашка'"
  },
  tab2: {
    result: "Расчет для вкладки 2: 87 500 руб.",
    details: "Детальный расчет на выбранную дату",
    organization: "ООО 'Ромашка'"
  }
};