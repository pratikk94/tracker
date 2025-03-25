'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Form, Input, Button, Typography, Card, message, Spin, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, UserAddOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/AuthContext';
import { ThemeContext } from '@/app/providers';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

const { Title, Text } = Typography;

const RegisterPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, signUp, loading } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const router = useRouter();
  const [form] = Form.useForm();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const onFinish = async (values: { displayName: string; email: string; password: string; confirmPassword: string; }) => {
    if (values.password !== values.confirmPassword) {
      message.error('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await signUp(values.email, values.password, values.displayName);
      message.success('Account created successfully!');
      router.push('/dashboard');
    } catch (err) {
      const errorMessage = (err as Error).message;
      if (errorMessage.includes('email-already-in-use')) {
        message.error('Email already in use');
      } else {
        message.error('Failed to create account');
      }
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
            Create Account
          </Title>
          <Text type="secondary" style={{ color: isDarkMode ? '#d9d9d9' : 'inherit' }}>
            Join to start managing your tasks
          </Text>
        </div>
        
        <Form
          form={form}
          name="register"
          layout="vertical"
          onFinish={onFinish}
          style={{ marginBottom: '16px' }}
        >
          <Form.Item
            name="displayName"
            rules={[{ required: true, message: 'Please input your name!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              size="large" 
              placeholder="Full Name" 
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              size="large" 
              placeholder="Email" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              size="large"
              placeholder="Password" 
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              size="large"
              placeholder="Confirm Password" 
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '8px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large"
              icon={<UserAddOutlined />}
              loading={isSubmitting}
              block
            >
              Register
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ color: isDarkMode ? '#d9d9d9' : 'inherit' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#1890ff' }}>
              Log In
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage; 