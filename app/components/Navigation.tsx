'use client';

import React from 'react';
import { Layout, Menu, Button, Space, Typography, Avatar, Tooltip, Badge } from 'antd';
import { 
  DashboardOutlined, 
  BarChartOutlined, 
  ClockCircleOutlined,
  HeartOutlined,
  LogoutOutlined,
  BellOutlined,
  DropboxOutlined,
  CoffeeOutlined,
  UserOutlined,
  PlusOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { format } from 'date-fns';

const { Header, Sider } = Layout;
const { Title } = Typography;

interface NavigationProps {
  onWakeUp?: () => void;
  onWater?: () => void;
  onMeal?: () => void;
  onLogout?: () => void;
  userName?: string;
  onNewTask?: () => void;
  children: React.ReactNode;
}

export default function Navigation({ 
  onWakeUp, 
  onWater, 
  onMeal, 
  onLogout,
  userName,
  onNewTask,
  children 
}: NavigationProps) {
  const pathname = usePathname();

  const sideMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link href="/dashboard">Dashboard</Link>,
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: <Link href="/analytics">Analytics</Link>,
    },
    {
      key: '/recurring-tasks',
      icon: <ClockCircleOutlined />,
      label: <Link href="/recurring-tasks">Recurring Tasks</Link>,
    },
    {
      key: '/lifestyle',
      icon: <HeartOutlined />,
      label: <Link href="/lifestyle">Lifestyle</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme="light"
        style={{
          boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          backgroundColor: '#fff'
        }}
        width={240}
      >
        <div style={{ 
          padding: '24px 16px',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            Task Tracker
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={sideMenuItems}
          style={{ 
            border: 'none',
            padding: '8px'
          }}
        />
        {onLogout && (
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={onLogout}
            danger
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              width: 'calc(100% - 32px)'
            }}
          >
            Logout
          </Button>
        )}
      </Sider>
      <Layout style={{ marginLeft: 240 }}>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 999,
          height: '64px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Title level={4} style={{ margin: 0 }}>
              {pathname === '/dashboard' ? 'Task Dashboard' :
               pathname === '/analytics' ? 'Analytics' :
               pathname === '/recurring-tasks' ? 'Recurring Tasks' :
               pathname === '/lifestyle' ? 'Lifestyle' : 'Task Tracker'}
            </Title>
            {onNewTask && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onNewTask}
              >
                New Task
              </Button>
            )}
          </div>
          <Space size="large">
            <Space size="middle" split={<div style={{ width: '1px', height: '24px', backgroundColor: '#f0f0f0' }} />}>
              <Tooltip title="Log Wake Up">
                <Button 
                  type="text" 
                  icon={<BellOutlined />} 
                  onClick={onWakeUp}
                >
                  Wake Up
                </Button>
              </Tooltip>
              <Tooltip title="Log Water Intake">
                <Button 
                  type="text" 
                  icon={<DropboxOutlined />} 
                  onClick={onWater}
                >
                  Water
                </Button>
              </Tooltip>
              <Tooltip title="Log Meal">
                <Button 
                  type="text" 
                  icon={<CoffeeOutlined />} 
                  onClick={onMeal}
                >
                  Meal
                </Button>
              </Tooltip>
            </Space>
            <Space>
              <Typography.Text type="secondary" style={{ fontSize: '14px' }}>
                {format(new Date(), 'EEEE, MMMM d')}
              </Typography.Text>
              <Tooltip title={userName}>
                <Badge dot>
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                </Badge>
              </Tooltip>
            </Space>
          </Space>
        </Header>
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </Layout>
    </Layout>
  );
} 