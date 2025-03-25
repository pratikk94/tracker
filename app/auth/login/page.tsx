'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Form, Input, Button, Typography, Card, message, Spin, Alert } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/AuthContext';
import { ThemeContext } from '@/app/providers';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, login, loading } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const router = useRouter();
  const [form] = Form.useForm();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const onFinish = async (values: { email: string; password: string }) => {
    setIsSubmitting(true);
    
    try {
      await login(values.email, values.password);
      message.success('Login successful!');
      router.push('/dashboard');
    } catch (err) {
      message.error('Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: isDarkMode
          ? 'linear-gradient(135deg, #001529 0%, #002140 100%)'
          : 'linear-gradient(135deg, #1890ff 0%, #52c41a 100%)',
        position: 'relative'
      }}
      data-theme={isDarkMode ? 'dark' : 'light'}
    >
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <ThemeToggle />
      </div>
      
      <Card
        style={{ 
          width: '100%', 
          maxWidth: '400px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          background: isDarkMode ? '#1f1f1f' : '#fff',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ marginBottom: '8px', color: isDarkMode ? '#fff' : 'inherit' }}>
            Welcome Back
          </Title>
          <Text type="secondary" style={{ color: isDarkMode ? '#d9d9d9' : 'inherit' }}>
            Log in to access your tasks
          </Text>
        </div>
        
        <Form
          form={form}
          name="login"
          layout="vertical"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          style={{ marginBottom: '16px' }}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              size="large" 
              placeholder="Email" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              size="large"
              placeholder="Password" 
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '8px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large"
              icon={<LoginOutlined />}
              loading={isSubmitting}
              block
            >
              Log In
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ color: isDarkMode ? '#d9d9d9' : 'inherit' }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" style={{ color: '#1890ff' }}>
              Register
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage; 