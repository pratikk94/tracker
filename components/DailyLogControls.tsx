'use client';

import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, Row, Col, Statistic, Tag, Timeline, Tooltip, message, Spin } from 'antd';
import { 
  ClockCircleOutlined, 
  CalendarOutlined, 
  CheckCircleOutlined,
  CoffeeOutlined,
  CarOutlined
} from '@ant-design/icons';
import { logWakeUpTime, logSleepTime, logWorkStartTime, logWorkEndTime, getDailyLog } from '@/lib/logService';
import { DailyLog } from '@/lib/types';
import { format } from 'date-fns';

const { Title, Text } = Typography;

interface DailyLogControlsProps {
  userId: string;
}

const DailyLogControls: React.FC<DailyLogControlsProps> = ({ userId }) => {
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyLog = async () => {
      try {
        const log = await getDailyLog(userId);
        setDailyLog(log);
      } catch (error) {
        console.error('Error fetching daily log:', error);
        message.error('Failed to load daily log');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchDailyLog();
    }
  }, [userId]);

  const handleWakeUpClick = async () => {
    try {
      const log = await logWakeUpTime(userId);
      setDailyLog(log);
      message.success('Wake up time logged successfully');
    } catch (error) {
      console.error('Error logging wake-up time:', error);
      message.error('Failed to log wake-up time');
    }
  };

  const handleSleepClick = async () => {
    try {
      const log = await logSleepTime(userId);
      setDailyLog(log);
      message.success('Sleep time logged successfully');
    } catch (error) {
      console.error('Error logging sleep time:', error);
      message.error('Failed to log sleep time');
    }
  };

  const handleWorkStartClick = async () => {
    try {
      const log = await logWorkStartTime(userId);
      setDailyLog(log);
      message.success('Work start time logged successfully');
    } catch (error) {
      console.error('Error logging work start time:', error);
      message.error('Failed to log work start time');
    }
  };

  const handleWorkEndClick = async () => {
    try {
      const log = await logWorkEndTime(userId);
      setDailyLog(log);
      message.success('Work end time logged successfully');
    } catch (error) {
      console.error('Error logging work end time:', error);
      message.error('Failed to log work end time');
    }
  };

  const formatTimeDisplay = (isoString?: string) => {
    if (!isoString) return null;
    return format(new Date(isoString), 'hh:mm a');
  };

  if (loading) {
    return (
      <Card className="daily-log-card" style={{ marginBottom: '24px' }}>
        <Spin />
      </Card>
    );
  }

  return (
    <Card 
      className="daily-log-card"
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CalendarOutlined style={{ marginRight: '8px' }} />
          <span>Daily Log</span>
          <Tag color="blue" style={{ marginLeft: '8px' }}>
            {new Date().toLocaleDateString()}
          </Tag>
        </div>
      }
      style={{ marginBottom: '24px' }}
    >
      <Row gutter={[24, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false} style={{ background: '#f9f9f9' }}>
            <Statistic 
              title="Wake Up" 
              value={dailyLog?.wakeUpTime ? formatTimeDisplay(dailyLog.wakeUpTime) : 'Not recorded'} 
              prefix={<CoffeeOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: dailyLog?.wakeUpTime ? '#1890ff' : '#999' }}
            />
            {!dailyLog?.wakeUpTime && (
              <Button 
                type="primary" 
                onClick={handleWakeUpClick} 
                icon={<ClockCircleOutlined />}
                size="small"
                style={{ marginTop: '8px' }}
              >
                Log Wake Up
              </Button>
            )}
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false} style={{ background: '#f9f9f9' }}>
            <Statistic 
              title="Sleep" 
              value={dailyLog?.sleepTime ? formatTimeDisplay(dailyLog.sleepTime) : 'Not recorded'} 
              prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: dailyLog?.sleepTime ? '#722ed1' : '#999' }}
            />
            {!dailyLog?.sleepTime && (
              <Button 
                type="primary" 
                onClick={handleSleepClick} 
                icon={<ClockCircleOutlined />}
                size="small"
                style={{ marginTop: '8px', background: '#722ed1', borderColor: '#722ed1' }}
              >
                Log Sleep
              </Button>
            )}
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false} style={{ background: '#f9f9f9' }}>
            <Statistic 
              title="Work Start" 
              value={dailyLog?.workStartTime ? formatTimeDisplay(dailyLog.workStartTime) : 'Not recorded'} 
              prefix={<CarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: dailyLog?.workStartTime ? '#52c41a' : '#999' }}
            />
            {!dailyLog?.workStartTime && (
              <Button 
                type="primary" 
                onClick={handleWorkStartClick} 
                icon={<ClockCircleOutlined />}
                size="small"
                style={{ marginTop: '8px', background: '#52c41a', borderColor: '#52c41a' }}
              >
                Start Work
              </Button>
            )}
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false} style={{ background: '#f9f9f9' }}>
            <Statistic 
              title="Work End" 
              value={dailyLog?.workEndTime ? formatTimeDisplay(dailyLog.workEndTime) : 'Not recorded'} 
              prefix={<CheckCircleOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: dailyLog?.workEndTime ? '#fa8c16' : '#999' }}
            />
            {!dailyLog?.workEndTime && dailyLog?.workStartTime && (
              <Button 
                type="primary" 
                onClick={handleWorkEndClick} 
                icon={<ClockCircleOutlined />}
                size="small"
                style={{ marginTop: '8px', background: '#fa8c16', borderColor: '#fa8c16' }}
              >
                End Work
              </Button>
            )}
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default DailyLogControls; 