'use client';

import React, { useEffect, useState } from 'react';
import { Card, Typography, Row, Col, Statistic, Progress, Select, Spin, Empty, Divider } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  FireOutlined, 
  WarningOutlined,
  AreaChartOutlined
} from '@ant-design/icons';
import { calculatePerformanceMetrics, calculateDailyPerformance } from '@/lib/logService';
import { PerformanceMetrics } from '@/lib/types';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const { Title: AntTitle, Text } = Typography;
const { Option } = Select;

interface PerformanceWidgetProps {
  userId: string;
}

const PerformanceWidget: React.FC<PerformanceWidgetProps> = ({ userId }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [dailyScore, setDailyScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        const metricsData = await calculatePerformanceMetrics(userId, parseInt(timeframe));
        const dailyPerformance = await calculateDailyPerformance(userId);
        
        setMetrics(metricsData);
        setDailyScore(dailyPerformance);
      } catch (error) {
        console.error('Error fetching performance data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchPerformanceData();
    }
  }, [userId, timeframe]);

  const handleTimeframeChange = (value: '7' | '30' | '90') => {
    setTimeframe(value);
  };

  const priorityChartData = metrics ? {
    labels: ['High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Tasks by Priority',
        data: [
          metrics.tasksCompletedByPriority.high, 
          metrics.tasksCompletedByPriority.medium, 
          metrics.tasksCompletedByPriority.low
        ],
        backgroundColor: [
          'rgba(255, 77, 79, 0.7)',
          'rgba(250, 173, 20, 0.7)',
          'rgba(82, 196, 26, 0.7)',
        ],
        borderColor: [
          'rgb(255, 77, 79)',
          'rgb(250, 173, 20)',
          'rgb(82, 196, 26)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const getScoreColor = () => {
    if (dailyScore >= 80) return '#52c41a';
    if (dailyScore >= 60) return '#faad14';
    return '#ff4d4f';
  };

  if (loading) {
    return (
      <Card style={{ marginBottom: '24px', textAlign: 'center', padding: '40px 0' }}>
        <Spin />
        <div style={{ marginTop: '16px' }}>Loading performance data...</div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AreaChartOutlined style={{ marginRight: '8px' }} />
            <span>Performance Metrics</span>
          </div>
          <Select 
            value={timeframe} 
            onChange={handleTimeframeChange}
            style={{ width: 150 }}
            size="small"
          >
            <Option value="7">Last 7 days</Option>
            <Option value="30">Last 30 days</Option>
            <Option value="90">Last 90 days</Option>
          </Select>
        </div>
      }
      style={{ marginBottom: '24px' }}
    >
      <Row gutter={[16, 24]}>
        <Col xs={24} sm={12} md={6}>
          <Statistic 
            title="Today's Score" 
            value={Math.round(dailyScore)} 
            suffix="/ 100"
            valueStyle={{ color: getScoreColor() }}
            prefix={<FireOutlined />}
          />
          <Progress 
            percent={dailyScore} 
            status={dailyScore >= 80 ? "success" : dailyScore >= 60 ? "normal" : "exception"} 
            size="small" 
            showInfo={false}
            style={{ marginTop: '8px' }}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic 
            title="Completion Rate" 
            value={metrics ? Math.round(metrics.completionRate) : 0} 
            suffix="%"
            valueStyle={{ color: '#1890ff' }}
            prefix={<CheckCircleOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic 
            title="Tasks Completed" 
            value={metrics?.totalTasksCompleted || 0}
            valueStyle={{ color: '#52c41a' }}
            prefix={<CheckCircleOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic 
            title="Avg. Completion Time" 
            value={metrics ? Math.round(metrics.avgCompletionTime * 10) / 10 : 0}
            suffix="hours"
            valueStyle={{ color: '#722ed1' }}
            prefix={<ClockCircleOutlined />}
          />
        </Col>
      </Row>

      <Divider />

      <Row gutter={[16, 24]}>
        <Col xs={24} md={12}>
          <AntTitle level={5} style={{ textAlign: 'center', marginBottom: '16px' }}>
            Tasks by Priority
          </AntTitle>
          {priorityChartData ? (
            <div style={{ maxHeight: '250px' }}>
              <Doughnut 
                data={priorityChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    }
                  }
                }} 
              />
            </div>
          ) : (
            <Empty description="No priority data available" />
          )}
        </Col>

        <Col xs={24} md={12}>
          <AntTitle level={5} style={{ marginBottom: '16px' }}>Additional Metrics</AntTitle>
          <Row gutter={[0, 16]}>
            <Col span={24}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>
                  <WarningOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                  Deadlines Missed
                </Text>
                <Text strong>{metrics?.deadlinesMissed || 0}</Text>
              </div>
            </Col>
            
            {metrics?.avgSleepDuration && (
              <Col span={24}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>
                    <ClockCircleOutlined style={{ color: '#722ed1', marginRight: '8px' }} />
                    Avg. Sleep Duration
                  </Text>
                  <Text strong>{Math.round(metrics.avgSleepDuration * 10) / 10} hours</Text>
                </div>
              </Col>
            )}
            
            {metrics?.avgWorkDuration && (
              <Col span={24}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>
                    <ClockCircleOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                    Avg. Work Duration
                  </Text>
                  <Text strong>{Math.round(metrics.avgWorkDuration * 10) / 10} hours</Text>
                </div>
              </Col>
            )}
          </Row>
        </Col>
      </Row>
    </Card>
  );
};

export default PerformanceWidget; 