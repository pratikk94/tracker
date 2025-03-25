'use client';

import React, { useEffect, useState, useContext } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ThemeContext } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { 
  Layout, Typography, Card, Row, Col, Button, Tabs, Tag, 
  Spin, Empty, Alert, message, Space
} from 'antd';
import { 
  DashboardOutlined, 
  BarChartOutlined, 
  SettingOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  LogoutOutlined,
  CoffeeOutlined,
  DropboxOutlined
} from '@ant-design/icons';
import ThemeToggle from '@/components/ThemeToggle';
import MealForm from '@/components/MealForm';
import SleepForm from '@/components/SleepForm';
import WaterIntakeForm from '@/components/WaterIntakeForm';
import ScheduleForm from '@/components/ScheduleForm';
import { processRecurringTasks } from '@/lib/taskService';
import { TaskStatus, TaskPriority } from '@/lib/types';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const LifestylePage = () => {
  const { user, loading, logout } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('1');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
      message.error('Failed to log out');
    }
  };

  const handleProcessRecurringItems = async () => {
    if (user) {
      try {
        message.loading('Processing recurring items...');
        await processRecurringTasks(user.uid);
        message.success('All recurring items processed successfully!');
      } catch (error) {
        console.error('Error processing recurring items:', error);
        message.error('Error processing recurring items');
      }
    }
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }} data-theme={isDarkMode ? 'dark' : 'light'}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={value => setCollapsed(value)}
        theme={isDarkMode ? 'dark' : 'light'}
        style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.05)' }}
      >
        <div className="logo">
          {!collapsed && 'Task Tracker'}
        </div>
        <Menu 
          theme={isDarkMode ? 'dark' : 'light'} 
          mode="inline" 
          defaultSelectedKeys={['5']}
          items={[
            {
              key: '1',
              icon: <DashboardOutlined />,
              label: 'Dashboard',
              onClick: () => router.push('/dashboard')
            },
            {
              key: '2',
              icon: <BarChartOutlined />,
              label: 'Analytics',
              onClick: () => router.push('/analytics')
            },
            {
              key: '3',
              icon: <SettingOutlined />,
              label: 'Recurring Tasks',
              onClick: () => router.push('/admin')
            },
            {
              key: '5',
              icon: <CalendarOutlined />,
              label: 'Lifestyle',
              onClick: () => router.push('/lifestyle')
            },
            {
              key: '4',
              icon: <LogoutOutlined />,
              label: 'Logout',
              onClick: handleLogout
            }
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: isDarkMode ? '#141414' : '#fff', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
        }}>
          <Title level={4} style={{ margin: 0, color: isDarkMode ? '#ffffff' : '#000000' }}>
            <CalendarOutlined /> Lifestyle Manager
          </Title>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Space size="small">
              <Button 
                type="text" 
                icon={<ClockCircleOutlined />} 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/logs/wakeup', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ userId: user.uid }),
                    });
                    if (response.ok) {
                      message.success('Wake up time logged successfully');
                    } else {
                      message.error('Failed to log wake up time');
                    }
                  } catch (error) {
                    console.error('Error logging wake-up time:', error);
                    message.error('Failed to log wake-up time');
                  }
                }}
              >
                Wake Up
              </Button>
              <Button 
                type="text" 
                icon={<DropboxOutlined />} 
                onClick={() => {
                  const waterTaskData = {
                    title: 'Drink Water (250ml)',
                    description: 'Remember to stay hydrated!',
                    status: 'todo' as TaskStatus,
                    priority: 'medium' as TaskPriority,
                    deadline: new Date().toISOString(),
                    userId: user.uid,
                    isRecurring: false,
                    completedAt: null,
                    type: 'water',
                    createdAt: new Date().toISOString()
                  };
                  fetch('/api/tasks', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(waterTaskData),
                  }).then(response => {
                    if (response.ok) {
                      message.success('Water intake reminder added');
                    } else {
                      message.error('Failed to add water intake reminder');
                    }
                  }).catch(error => {
                    console.error('Error adding water intake:', error);
                    message.error('Failed to add water intake reminder');
                  });
                }}
              >
                Water
              </Button>
              <Button 
                type="text" 
                icon={<CoffeeOutlined />} 
                onClick={() => {
                  const mealTaskData = {
                    title: 'Meal Time',
                    description: 'Time for your scheduled meal',
                    status: 'todo' as TaskStatus,
                    priority: 'high' as TaskPriority,
                    deadline: new Date().toISOString(),
                    userId: user.uid,
                    isRecurring: false,
                    completedAt: null,
                    type: 'meal',
                    createdAt: new Date().toISOString()
                  };
                  fetch('/api/tasks', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(mealTaskData),
                  }).then(response => {
                    if (response.ok) {
                      message.success('Meal reminder added');
                    } else {
                      message.error('Failed to add meal reminder');
                    }
                  }).catch(error => {
                    console.error('Error adding meal reminder:', error);
                    message.error('Failed to add meal reminder');
                  });
                }}
              >
                Meal
              </Button>
            </Space>
            <ThemeToggle />
            <span style={{ marginRight: '16px', marginLeft: '16px', color: isDarkMode ? '#a0a0a0' : '#595959' }}>
              <ClockCircleOutlined style={{ marginRight: '8px' }} />
              {new Date().toLocaleDateString()}
            </span>
            <span style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
              <UserOutlined style={{ marginRight: '8px' }} />
              {user.displayName || user.email}
            </span>
          </div>
        </Header>
        <Content style={{ padding: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card style={{ marginBottom: '16px' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Alert
                    message="Lifestyle Manager"
                    description="Set up meal plans, sleep schedules, water intake reminders, and daily schedules. All items will automatically appear in your Task Board at the appropriate times."
                    type="info"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />
                  <Button 
                    type="primary" 
                    onClick={handleProcessRecurringItems}
                  >
                    Process All Recurring Items Now
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
          
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                tabPosition="top"
                type="card"
                items={[
                  {
                    key: '1',
                    label: (
                      <span>
                        <CoffeeOutlined /> Meal Planning
                      </span>
                    ),
                    children: (
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <MealForm 
                            userId={user.uid} 
                            onMealAdded={() => {}} 
                          />
                        </Col>
                        <Col xs={24} md={12}>
                          <Card title="Manage Meal Plans">
                            <p>Your meal plans will appear in your task board at the scheduled times.</p>
                            <p>View your meals in the Dashboard.</p>
                          </Card>
                        </Col>
                      </Row>
                    ),
                  },
                  {
                    key: '2',
                    label: (
                      <span>
                        <ClockCircleOutlined /> Sleep Schedule
                      </span>
                    ),
                    children: (
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <SleepForm 
                            userId={user.uid} 
                            onSleepAdded={() => {}} 
                          />
                        </Col>
                        <Col xs={24} md={12}>
                          <Card title="Sleep Schedule Tips">
                            <p>Maintaining a consistent sleep schedule helps improve your overall health and productivity.</p>
                            <p>Bedtime reminders will appear in your task board.</p>
                          </Card>
                        </Col>
                      </Row>
                    ),
                  },
                  {
                    key: '3',
                    label: (
                      <span>
                        <DropboxOutlined /> Water Intake
                      </span>
                    ),
                    children: (
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <WaterIntakeForm 
                            userId={user.uid} 
                            onWaterAdded={() => {}} 
                          />
                        </Col>
                        <Col xs={24} md={12}>
                          <Card title="Hydration Tips">
                            <p>Experts recommend drinking at least 2 liters of water per day.</p>
                            <p>Set up several reminders throughout the day to maintain proper hydration.</p>
                          </Card>
                        </Col>
                      </Row>
                    ),
                  },
                  {
                    key: '4',
                    label: (
                      <span>
                        <CalendarOutlined /> Schedule
                      </span>
                    ),
                    children: (
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <ScheduleForm 
                            userId={user.uid} 
                            onScheduleAdded={() => {}} 
                          />
                        </Col>
                        <Col xs={24} md={12}>
                          <Card title="Schedule Management">
                            <p>Add important events, meetings, and commitments to your schedule.</p>
                            <p>All schedule items will appear in your task board as to-do tasks.</p>
                          </Card>
                        </Col>
                      </Row>
                    ),
                  }
                ]}
              />
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default LifestylePage;

// Custom Menu component to fix TypeScript issues
const Menu = ({ items, defaultSelectedKeys, mode, theme }: any) => {
  return (
    <div className={`ant-menu ant-menu-root ant-menu-${mode} ant-menu-${theme}`}>
      {items.map((item: any) => (
        <div
          key={item.key}
          className={`ant-menu-item ${defaultSelectedKeys.includes(item.key) ? 'ant-menu-item-selected' : ''}`}
          onClick={item.onClick}
          style={{ padding: '0 24px', height: '40px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          {item.icon}
          <span style={{ marginLeft: '10px' }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}; 