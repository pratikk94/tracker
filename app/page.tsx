'use client';

import React, { useContext } from 'react';
import { Button, Typography, Space, Card, Row, Col } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, LineChartOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { ThemeContext } from './providers';
import ThemeToggle from '@/components/ThemeToggle';

const { Title, Paragraph } = Typography;

export default function Home() {
  const { isDarkMode } = useContext(ThemeContext);
  
  return (
    <div style={{ 
      background: isDarkMode 
        ? 'linear-gradient(135deg, #001529 0%, #002140 100%)' 
        : 'linear-gradient(135deg, #1890ff 0%, #52c41a 100%)',
      minHeight: '100vh',
      padding: '40px 0'
    }} data-theme={isDarkMode ? 'dark' : 'light'}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 20px',
        position: 'relative' 
      }}>
        <div style={{ 
          position: 'absolute', 
          top: '20px', 
          right: '20px',
          zIndex: 100
        }}>
          <ThemeToggle />
        </div>
        
        <Row gutter={[24, 24]} align="middle" justify="center">
          <Col xs={24} md={12}>
            <div style={{ color: 'white', padding: '40px 0' }}>
              <Title style={{ color: 'white', fontSize: '48px', marginBottom: '16px' }}>
                Task Tracker
              </Title>
              <Paragraph style={{ color: 'white', fontSize: '18px', marginBottom: '32px' }}>
                A powerful Kanban-style task management system with performance analytics
                to help you stay productive and organized.
              </Paragraph>
              <Space size="large">
                <Link href="/auth/login" passHref>
                  <Button type="primary" size="large" style={{ height: '46px', fontWeight: 'bold' }}>
                    Log In
                  </Button>
                </Link>
                <Link href="/auth/register" passHref>
                  <Button size="large" style={{ height: '46px', fontWeight: 'bold' }}>
                    Register Now
                  </Button>
                </Link>
              </Space>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <Card style={{ 
              borderRadius: '12px', 
              overflow: 'hidden', 
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              background: isDarkMode ? '#1f1f1f' : '#fff'
            }}>
              <img 
                src="https://gw.alipayobjects.com/zos/rmsportal/RzwpdLnhmvDJToTdfDPe.png" 
                alt="Task Board Illustration" 
                style={{ width: '100%', borderRadius: '8px' }}
              />
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: '80px' }}>
          <Title level={2} style={{ color: 'white', textAlign: 'center', marginBottom: '48px' }}>
            Key Features
          </Title>
          
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card 
                style={{ 
                  height: '100%', 
                  borderRadius: '8px', 
                  background: isDarkMode ? '#1f1f1f' : '#fff',
                  boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.1)'
                }}
                hoverable
              >
                <div style={{ textAlign: 'center' }}>
                  <CalendarOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                  <Title level={4} style={{ color: isDarkMode ? '#fff' : 'inherit' }}>Kanban Board</Title>
                  <Paragraph style={{ color: isDarkMode ? '#d9d9d9' : 'inherit' }}>
                    Organize tasks by status with an intuitive drag-and-drop interface.
                    Easily manage your workflow with To Do, In Progress, and Completed columns.
                  </Paragraph>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card 
                style={{ 
                  height: '100%', 
                  borderRadius: '8px', 
                  background: isDarkMode ? '#1f1f1f' : '#fff',
                  boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.1)'
                }}
                hoverable
              >
                <div style={{ textAlign: 'center' }}>
                  <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                  <Title level={4} style={{ color: isDarkMode ? '#fff' : 'inherit' }}>Priority Management</Title>
                  <Paragraph style={{ color: isDarkMode ? '#d9d9d9' : 'inherit' }}>
                    Assign high, medium, or low priority to tasks. Set deadlines and 
                    track recurring tasks to ensure nothing falls through the cracks.
                  </Paragraph>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card 
                style={{ 
                  height: '100%', 
                  borderRadius: '8px', 
                  background: isDarkMode ? '#1f1f1f' : '#fff',
                  boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.1)'
                }}
                hoverable
              >
                <div style={{ textAlign: 'center' }}>
                  <LineChartOutlined style={{ fontSize: '48px', color: '#722ed1', marginBottom: '16px' }} />
                  <Title level={4} style={{ color: isDarkMode ? '#fff' : 'inherit' }}>Performance Analytics</Title>
                  <Paragraph style={{ color: isDarkMode ? '#d9d9d9' : 'inherit' }}>
                    Track productivity metrics, task completion rates, and work habits.
                    Gain insights to improve your time management and efficiency.
                  </Paragraph>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
} 