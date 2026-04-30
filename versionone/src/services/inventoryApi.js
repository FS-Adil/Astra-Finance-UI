import axios from 'axios';
import dayjs from 'dayjs';

// Базовый URL для API через прокси
const API_BASE_URL = '/api/v3';

// Конфигурация axios
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для логирования запросов
api.interceptors.request.use(request => {
  console.log(`🚀 [Inventory API] [${request.method.toUpperCase()}] ${request.url}`, request.data || '');
  return request;
});

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  response => {
    console.log(`✅ [Inventory API] [${response.config.method.toUpperCase()}] ${response.config.url}`, response.status);
    return response;
  },
  error => {
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ [Inventory API] Таймаут запроса');
    } else if (error.response) {
      console.error(`❌ [Inventory API] [${error.config?.method?.toUpperCase()}] ${error.config?.url}`, error.response.status);
    } else if (error.request) {
      console.error('📡 [Inventory API] Сервер не отвечает');
    } else {
      console.error('🔧 [Inventory API] Ошибка настройки запроса', error.message);
    }
    return Promise.reject(error);
  }
);

// =============== ТЕСТОВЫЕ ДАННЫЕ ДЛЯ ОСТАТКОВ ===============
const PRODUCT_CATEGORIES = [
  'Электроника', 'Одежда', 'Продукты', 'Мебель', 'Канцелярия',
  'Автозапчасти', 'Косметика', 'Книги', 'Игрушки', 'Спорттовары'
];

const NOMENCLATURE_ITEMS = [
  'Болт М12', 'Гайка М12', 'Шайба 12', 'Подшипник 6205', 'Сальник 40x60x10',
  'Ремень ГРМ', 'Фильтр масляный', 'Прокладка ГБЦ', 'Свеча зажигания', 'Тормозные колодки',
  'Аккумулятор 60Ач', 'Стартер', 'Генератор', 'Радиатор охлаждения', 'Топливный насос',
  'Амортизатор передний', 'Пружина подвески', 'Рулевой наконечник', 'Шаровая опора', 'Ступичный подшипник'
];

// =============== ФЛАГ СОСТОЯНИЯ СЕРВЕРА ===============
let serverAvailable = true;

/**
 * Установить статус сервера
 */
export const setInventoryServerStatus = (status) => {
  serverAvailable = status;
};

/**
 * Получить статус сервера
 */
export const getInventoryServerStatus = () => {
  return serverAvailable;
};

// =============== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===============

/**
 * Генерация тестовых данных для остатков на складе
 * @param {string} date - дата в формате YYYY-MM-DD
 * @param {string} organizationId - ID организации
 * @param {string} organizationName - название организации
 * @returns {Array} - массив остатков
 */
const generateMockBalanceData = (date, organizationId, organizationName = 'Тестовая организация') => {
  const recordCount = Math.floor(Math.random() * 100) + 50;
  
  return Array.from({ length: recordCount }, (_, i) => {
    const quantity = Math.floor(Math.random() * 500) + 1;
    const cost = parseFloat((Math.random() * 5000 + 100).toFixed(2));
    
    return {
      id: `${organizationId}-balance-${i + 1}-${Date.now()}`,
      productId: `PRD-${(i + 1).toString().padStart(6, '0')}`,
      name: NOMENCLATURE_ITEMS[i % NOMENCLATURE_ITEMS.length],
      characteristic: `Характеристика ${Math.floor(Math.random() * 10) + 1}`,
      batch: `Партия ${Math.floor(Math.random() * 20) + 1}`,
      category: PRODUCT_CATEGORIES[Math.floor(Math.random() * PRODUCT_CATEGORIES.length)],
      quantity: quantity,
      cost: cost,
      totalCost: parseFloat((quantity * cost).toFixed(2)),
      date,
      organization: organizationName,
      organizationId: organizationId,
    };
  });
};

/**
 * Преобразователь данных остатков с сервера
 * @param {Array} serverData - данные с сервера
 * @param {string} date - дата
 * @param {string} organizationId - ID организации
 * @param {string} orgName - название организации
 * @returns {Array} - преобразованные данные
 */
const transformServerInventoryData = (serverData, date, organizationId, orgName) => {
  if (!serverData || !Array.isArray(serverData) || serverData.length === 0) {
    console.warn('[Inventory API] Нет данных с сервера для преобразования');
    return [];
  }

  console.log('[Inventory API] 🔄 Преобразование данных сервера:', serverData.length, 'записей');

  return serverData.map((item, index) => {
    // Извлекаем поля с поддержкой разных названий (русские/английские)
    const name = item['name'] || item['Наименование'] || item['наименование'] || '';
    const characteristic = item['characteristic'] || item['Характеристика'] || item['характеристика'] || '';
    const batch = item['batch'] || item['Партия'] || item['партия'] || '';
    const quantity = Number(item['quantity'] || item['Количество'] || item['количество'] || 0);
    const cost = Number(item['cost'] || item['Себестоимость'] || item['себестоимость'] || item['price'] || 0);
    
    // Генерируем ID, если его нет
    const id = item['id'] || item['refKey'] || item['ref_key'] || `${organizationId}-${index + 1}-${Date.now()}`;
    const productId = item['productId'] || item['number'] || item['Номер'] || `PRD-${(index + 1).toString().padStart(6, '0')}`;
    const category = item['category'] || item['Категория'] || item['категория'] || PRODUCT_CATEGORIES[0];

    return {
      id,
      productId,
      name: String(name || 'Без названия'),
      characteristic: String(characteristic),
      batch: String(batch),
      category: String(category),
      quantity: quantity,
      cost: cost,
      totalCost: parseFloat((quantity * cost).toFixed(2)),
      date: date,
      organization: orgName,
      organizationId,
    };
  });
};

// =============== ОСНОВНЫЕ ФУНКЦИИ API ===============

/**
 * Рассчитать себестоимость остатков на складе
 * @param {Object} params - параметры { date }
 * @param {string} organizationId - UUID организации
 * @param {string} userRole - роль пользователя
 * @returns {Object} - данные остатков с метаданными
 */
export const calculateAssemblyCost = async (params, organizationId, userRole = 'user') => {
  const { date } = params;
  
  // Валидация
  if (!date) {
    throw new Error('Не указана дата остатков');
  }

  if (!organizationId) {
    throw new Error('Не указана организация');
  }

  const formattedDate = dayjs(date).format('YYYY-MM-DD');
  
  console.log('[Inventory API] 🚀 Запрос остатков на складе:', {
    date: formattedDate,
    organizationId,
    userRole
  });

  try {
    // Реальный запрос к серверу
    const response = await api.post(`${API_BASE_URL}/inventory/balance-cost`, {
      date: formattedDate + 'T23:59:59',
      organizationId,
      user: userRole
    });
    
    serverAvailable = true;
    
    console.log('[Inventory API] 📦 Ответ от сервера:', response.data);

    // Получаем название организации (можно из кэша или отдельным запросом)
    const orgName = `Организация ${organizationId.substring(0, 8)}`;
    
    // Преобразуем данные с сервера
    let transformedData = [];
    
    if (response.data && Array.isArray(response.data)) {
      // Прямой массив данных
      transformedData = transformServerInventoryData(
        response.data, 
        formattedDate, 
        organizationId,
        orgName
      );
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      // Данные в объекте с полем data
      transformedData = transformServerInventoryData(
        response.data.data, 
        formattedDate, 
        organizationId,
        orgName
      );
    }

    console.log('[Inventory API] ✅ Преобразовано записей:', transformedData.length);

    // Рассчитываем итоги
    const totalCost = transformedData.reduce((sum, item) => sum + item.totalCost, 0);
    const totalQuantity = transformedData.reduce((sum, item) => sum + item.quantity, 0);

    return {
      data: transformedData,
      meta: {
        organizationId,
        organizationName: orgName,
        date: formattedDate,
        generatedAt: new Date().toISOString(),
        totalRecords: transformedData.length,
        totalCost,
        totalQuantity,
        source: 'server'
      },
      processId: `inventory_cost_${Date.now()}`
    };
    
  } catch (error) {
    // Если сервер недоступен, используем моковые данные
    console.warn('[Inventory API] ⚠️ Сервер недоступен, используем тестовые данные:', error.message);
    serverAvailable = false;
    
    const orgName = `Организация ${organizationId.substring(0, 8)}`;
    const mockData = generateMockBalanceData(formattedDate, organizationId, orgName);
    
    const totalCost = mockData.reduce((sum, item) => sum + item.totalCost, 0);
    const totalQuantity = mockData.reduce((sum, item) => sum + item.quantity, 0);
    
    return {
      data: mockData,
      meta: {
        organizationId,
        organizationName: orgName,
        date: formattedDate,
        generatedAt: new Date().toISOString(),
        totalRecords: mockData.length,
        totalCost,
        totalQuantity,
        source: 'mock'
      },
      processId: `inventory_cost_mock_${Date.now()}`
    };
  }
};

/**
 * Получить остатки на складе по фильтрам
 * @param {Object} filters - фильтры { date, organizationId, category, search }
 * @returns {Object} - отфильтрованные данные
 */
export const getInventoryBalance = async (filters = {}) => {
  const { date, organizationId, category, search } = filters;
  
  try {
    // Сначала получаем все остатки
    const fullData = await calculateAssemblyCost({ date }, organizationId);
    
    // Применяем фильтры
    let filteredData = [...fullData.data];
    
    if (category) {
      filteredData = filteredData.filter(item => item.category === category);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.batch.toLowerCase().includes(searchLower) ||
        item.productId.toLowerCase().includes(searchLower)
      );
    }
    
    const totalCost = filteredData.reduce((sum, item) => sum + item.totalCost, 0);
    const totalQuantity = filteredData.reduce((sum, item) => sum + item.quantity, 0);
    
    return {
      data: filteredData,
      meta: {
        ...fullData.meta,
        filteredRecords: filteredData.length,
        totalCost,
        totalQuantity,
        filters: { category, search }
      }
    };
    
  } catch (error) {
    console.error('[Inventory API] Ошибка при получении остатков:', error);
    throw error;
  }
};

/**
 * Получить список категорий товаров на складе
 * @param {string} date - дата
 * @param {string} organizationId - ID организации
 * @returns {Array} - список категорий
 */
export const getInventoryCategories = async (date, organizationId) => {
  try {
    const balanceData = await calculateAssemblyCost({ date }, organizationId);
    
    // Извлекаем уникальные категории
    const categories = [...new Set(balanceData.data.map(item => item.category))];
    
    return categories.filter(Boolean).sort();
    
  } catch (error) {
    console.error('[Inventory API] Ошибка при получении категорий:', error);
    return [];
  }
};

/**
 * Получить детальную информацию по позиции на складе
 * @param {string} itemId - ID позиции
 * @param {string} organizationId - ID организации
 * @returns {Object} - детальная информация
 */
export const getInventoryItemDetails = async (itemId, organizationId) => {
  try {
    const response = await api.get(`${API_BASE_URL}/inventory/items/${itemId}`, {
      params: { organizationId }
    });
    
    serverAvailable = true;
    return response.data;
    
  } catch (error) {
    console.warn('[Inventory API] ⚠️ Сервер недоступен, возвращаем заглушку для позиции:', itemId);
    serverAvailable = false;
    
    return {
      id: itemId,
      name: 'Тестовая позиция',
      quantity: Math.floor(Math.random() * 100) + 1,
      cost: parseFloat((Math.random() * 1000 + 50).toFixed(2)),
      organizationId,
      updatedAt: new Date().toISOString()
    };
  }
};

/**
 * Экспорт данных остатков в Excel/CSV
 * @param {Object} params - параметры экспорта
 * @returns {Blob} - файл для скачивания
 */
export const exportInventoryToExcel = async (params) => {
  const { date, organizationId, format = 'xlsx' } = params;
  
  try {
    const response = await api.post(`${API_BASE_URL}/inventory/export`, {
      date: dayjs(date).format('YYYY-MM-DD') + 'T23:59:59',
      organizationId,
      format
    }, {
      responseType: 'blob'
    });
    
    serverAvailable = true;
    return response.data;
    
  } catch (error) {
    console.error('[Inventory API] Ошибка при экспорте:', error);
    throw new Error('Не удалось экспортировать данные');
  }
};

// =============== ЭКСПОРТ УТИЛИТ ===============
export const inventoryApiUtils = {
  getServerStatus: getInventoryServerStatus,
  setServerStatus: setInventoryServerStatus,
};

export default {
  calculateAssemblyCost,
  getInventoryBalance,
  getInventoryCategories,
  getInventoryItemDetails,
  exportInventoryToExcel,
  inventoryApiUtils
};