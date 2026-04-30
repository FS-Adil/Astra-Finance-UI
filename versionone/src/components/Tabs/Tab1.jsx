import React, { useState } from 'react';
import { DatePicker, Button, message, Spin, Card } from 'antd';
import { CalendarOutlined, CalculatorOutlined } from '@ant-design/icons';
import { calculateTab1 } from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const Tab1 = ({ userRole }) => {
  const [dateRange, setDateRange] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning('Выберите период (даты от и до)');
      return;
    }

    const dateFrom = dateRange[0].format('YYYY-MM-DD');
    const dateTo = dateRange[1].format('YYYY-MM-DD');

    setLoading(true);
    try {
      const data = await calculateTab1(dateFrom, dateTo, userRole);
      setResult(data);
      message.success('Расчет выполнен успешно');
    } catch (error) {
      console.error('Calculation error:', error);
      message.error('Ошибка при расчете');
    } finally {
      setLoading(false);
    }
  };

  const handleClearResult = () => {
    setResult(null);
  };

  const disabledDate = (current) => {
    // Нельзя выбрать даты в будущем
    return current && current > dayjs().endOf('day');
  };

  return (
    <div className="tab-content">
      <h3>Расчет за период</h3>
      
      <div className="date-inputs">
        <div className="input-group">
          <label>
            <CalendarOutlined style={{ marginRight: 8 }} />
            Период (от - до):
          </label>
          <RangePicker
            style={{ width: '100%' }}
            onChange={(dates) => setDateRange(dates)}
            format="DD.MM.YYYY"
            placeholder={['Дата от', 'Дата до']}
            disabledDate={disabledDate}
            allowClear
            disabled={loading}
            value={dateRange}
            size="large"
          />
        </div>
      </div>

      <div className="button-group">
        <Button
          type="primary"
          icon={<CalculatorOutlined />}
          onClick={handleCalculate}
          loading={loading}
          size="large"
          disabled={!dateRange || !dateRange[0] || !dateRange[1]}
        >
          {loading ? 'Расчет...' : 'Рассчитать'}
        </Button>
        
        {result && (
          <Button onClick={handleClearResult} disabled={loading}>
            Очистить результат
          </Button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin tip="Выполняется расчет..." size="large">
            <div style={{ padding: 50 }} />
          </Spin>
        </div>
      )}

      {result && !loading && (
        <Card
          title="Результат расчета"
          style={{ marginTop: 20 }}
          extra={
            <small style={{ color: '#888' }}>
              Пользователь: {result.user}
            </small>
          }
        >
          <div className="result-value">
            {result.result}
          </div>
          <div className="result-details">
            {result.details}
          </div>
          {result.period && (
            <div style={{ marginTop: 10, color: '#666' }}>
              <strong>Период:</strong> {result.period}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default Tab1;