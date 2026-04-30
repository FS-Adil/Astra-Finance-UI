import React, { useState, useEffect, useRef } from 'react';
import { Card, DatePicker, Button, Space, message, Alert, Badge, Tooltip, Tag, Table } from 'antd';
import { SearchOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { calculateAssemblyCost, getInventoryServerStatus } from '../../services/inventoryApi';

const Tab2 = ({ userRole, organization }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [data, setData] = useState([]);
  const [apiError, setApiError] = useState(null);
  const [serverStatus, setServerStatus] = useState(true);
  const [metaData, setMetaData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  
  const isMounted = useRef(true);
  const currentRequest = useRef(null);

  useEffect(() => {
    console.log('🔄 Компонент Tab2 монтируется');
    isMounted.current = true;
    setServerStatus(getInventoryServerStatus());
    
    return () => {
      console.log('🔄 Компонент Tab2 размонтируется');
      isMounted.current = false;
      if (currentRequest.current) {
        currentRequest.current.abort();
      }
    };
  }, []);

  const handleCalculate = async () => {
    if (!selectedDate) {
      message.warning('Пожалуйста, выберите дату');
      return;
    }

    console.log('🚀 Tab2: Начинаем расчет себестоимости остатков на складе:', {
      date: selectedDate.format('YYYY-MM-DD'),
      organizationId: organization.id,
      organizationName: organization.name,
      userRole
    });

    setData([]);
    setMetaData(null);
    setApiError(null);
    
    setLoading(true);
    
    const abortController = new AbortController();
    currentRequest.current = abortController;
    
    try {
      const response = await calculateAssemblyCost({
        date: selectedDate.format('YYYY-MM-DD')
      }, organization.id, userRole);
      
      console.log('📊 Tab2: Ответ от calculateAssemblyCost:', response);
      
      if (!isMounted.current) return;
      
      let reportData = [];
      let reportMeta = null;
      
      if (response && response.data && Array.isArray(response.data)) {
        reportData = response.data;
        reportMeta = response.meta || null;
      } else if (Array.isArray(response)) {
        reportData = response;
      }
      
      setData(reportData);
      setMetaData(reportMeta);
      
      const serverAvailable = getInventoryServerStatus();
      setServerStatus(serverAvailable);
      
      if (reportData.length === 0) {
        message.info('Нет остатков на складе за выбранную дату');
      } else {
        const source = !serverAvailable ? 'тестовых данных' : 'сервера';
        message.success(`Данные загружены с ${source} (${reportData.length} записей)`);
      }
      
    } catch (error) {
      if (error.name === 'AbortError' || error.message === 'canceled') {
        console.log('🛑 Запрос отменен');
        return;
      }
      
      if (!isMounted.current) return;
      
      console.error('❌ Ошибка при расчете:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Ошибка при расчете себестоимости остатков';
      setApiError(errorMessage);
      message.error(errorMessage);
      
      setData([]);
      setMetaData(null);
      
    } finally {
      if (isMounted.current) {
        setLoading(false);
        currentRequest.current = null;
      }
    }
  };

  const disabledDate = (current) => {
    return current && current > dayjs().endOf('day');
  };

  const getFormattedDate = () => {
    if (!selectedDate) return '';
    return selectedDate.format('DD.MM.YYYY');
  };

  // Колонки для Table
  const columns = [
    {
      title: 'Наименование',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      fixed: 'left',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      render: (text) => text || '—',
    },
    {
      title: 'Характеристика',
      dataIndex: 'characteristic',
      key: 'characteristic',
      width: 150,
      render: (text) => text || '—',
    },
    {
      title: 'Партия',
      dataIndex: 'batch',
      key: 'batch',
      width: 120,
      render: (text) => text || '—',
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 130,
      align: 'right',
      sorter: (a, b) => (a.quantity || 0) - (b.quantity || 0),
      render: (value) => (value || 0).toLocaleString('ru-RU'),
    },
    {
      title: 'Себестоимость',
      dataIndex: 'cost',
      key: 'cost',
      width: 180,
      align: 'right',
      sorter: (a, b) => (a.cost || 0) - (b.cost || 0),
      render: (value) => {
        if (value === undefined || value === null) return '0,00 ₽';
        return `${value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`;
      },
    },
    {
      title: 'Сумма',
      key: 'totalCost',
      width: 180,
      align: 'right',
      sorter: (a, b) => ((a.quantity || 0) * (a.cost || 0)) - ((b.quantity || 0) * (b.cost || 0)),
      render: (_, record) => {
        const total = (record.quantity || 0) * (record.cost || 0);
        return `${total.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`;
      },
    },
  ];

  // Расчет итогов
  const totals = data.reduce((acc, item) => {
    acc.quantity += item.quantity || 0;
    acc.cost += item.cost || 0;
    acc.totalCost += (item.quantity || 0) * (item.cost || 0);
    return acc;
  }, { quantity: 0, cost: 0, totalCost: 0 });

  // Футер таблицы с итогами
  const tableFooter = () => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      fontWeight: 'bold',
      padding: '8px 0',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      <span>Итого по всем позициям:</span>
      <span>Количество: {totals.quantity.toLocaleString('ru-RU')}</span>
      <span>
        Общая себестоимость: {totals.totalCost.toLocaleString('ru-RU', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })} ₽
      </span>
    </div>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Карточка с параметрами */}
      <Card 
        title={
          <Space>
            <span>Расчет себестоимости остатков на складе</span>
            {!serverStatus && (
              <Tooltip title="Сервер недоступен. Используются тестовые данные.">
                <Badge status="warning" text="Тестовый режим" />
              </Tooltip>
            )}
          </Space>
        }
      >
        {apiError && (
          <Alert
            message="Ошибка"
            description={apiError}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
            onClose={() => setApiError(null)}
          />
        )}
        
        {!serverStatus && !apiError && (
          <Alert
            message="Информация"
            description="Вы работаете с тестовыми данными. Для работы с реальными данными убедитесь, что сервер доступен."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Информация об организации */}
          <div style={{ 
            padding: '12px', 
            background: '#f0f4ff', 
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ color: '#555', fontWeight: 500 }}>Организация:</span>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#667eea' }}>
              {organization.name}
            </span>
          </div>

          {/* Выбор даты */}
          <div>
            <div style={{ marginBottom: 8 }}>Дата остатков:</div>
            <DatePicker 
              style={{ width: '100%' }}
              onChange={(date) => setSelectedDate(date)}
              format="DD.MM.YYYY"
              placeholder="Выберите дату"
              disabledDate={disabledDate}
              allowClear
              disabled={loading}
              value={selectedDate}
              size="large"
            />
          </div>

          {/* Кнопка расчета */}
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleCalculate}
            loading={loading}
            size="large"
            block
            disabled={!selectedDate}
          >
            {loading ? 'Расчет...' : 'Рассчитать остатки'}
          </Button>
        </Space>
      </Card>

      {/* Результаты расчета */}
      {data.length > 0 && (
        <Card 
          title={
            <Space>
              <span>Остатки на складе</span>
              {!serverStatus && (
                <Tag color="warning">Тестовые данные</Tag>
              )}
            </Space>
          }
          extra={
            <Space split="|" size={4}>
              <span>
                <strong>Организация:</strong> {organization.name}
              </span>
              <span>
                <strong>Дата:</strong> {getFormattedDate()}
              </span>
              {metaData && metaData.totalRecords > 0 && (
                <span>
                  <strong>Всего позиций:</strong> {metaData.totalRecords}
                </span>
              )}
            </Space>
          }
          bodyStyle={{ padding: '12px' }}
        >
          <Table
            columns={columns}
            dataSource={data}
            loading={loading}
            scroll={{ x: 1000, y: 'calc(100vh - 500px)' }}
            pagination={false}
            rowKey="id"
            footer={tableFooter}
            size="middle"
            bordered
            locale={{
              emptyText: 'Нет данных'
            }}
          />
          
          {/* Итоговая информация */}
          <div style={{ 
            marginTop: 16, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px 0',
            borderTop: '1px solid #f0f0f0'
          }}>
            <Space size="large">
              {metaData && metaData.totalCost !== undefined && (
                <span>
                  <strong>Общая себестоимость остатков:</strong>{' '}
                  {new Intl.NumberFormat('ru-RU', { 
                    style: 'currency', 
                    currency: 'RUB',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).format(metaData.totalCost)}
                </span>
              )}
              {!metaData && (
                <>
                  <span>
                    <strong>Общее количество:</strong> {totals.quantity.toLocaleString('ru-RU')}
                  </span>
                  <span>
                    <strong>Общая себестоимость:</strong>{' '}
                    {totals.totalCost.toLocaleString('ru-RU', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })} ₽
                  </span>
                </>
              )}
            </Space>
            <span>
              {!serverStatus && (
                <span style={{ color: '#faad14' }}>
                  <WarningOutlined style={{ marginRight: 8 }} />
                  Демонстрационные данные
                </span>
              )}
              {!metaData && (
                <span style={{ marginLeft: 16 }}>
                  Всего позиций: <strong>{data.length}</strong>
                </span>
              )}
            </span>
          </div>
        </Card>
      )}
    </Space>
  );
};

export default Tab2;