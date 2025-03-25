'use client';

import React, { useEffect, useState, useContext } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ThemeContext } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { 
  Layout, Typography, Card, Row, Col, Button, Table, Tag, 
  Spin, Empty, Alert, Modal, message, Space, Tooltip, Switch 
} from 'antd';
import { 
  DashboardOutlined, 
  BarChartOutlined, 
  SettingOutlined,
  SyncOutlined, 
  ClockCircleOutlined,
  DeleteOutlined,
  PoweroffOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  UserOutlined,
  LogoutOutlined,
  CalendarOutlined,
  CoffeeOutlined,
  DropboxOutlined
} from '@ant-design/icons';
import { Task, TaskStatus, TaskPriority } from '@/lib/types';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { processRecurringTasks } from '@/lib/taskService';
import ThemeToggle from '@/components/ThemeToggle';
import RecurringTaskForm from '@/components/RecurringTaskForm';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const AdminPage = () => {
  const { user, loading, logout } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const router = useRouter();
  const [recurringTasks, setRecurringTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const fetchRecurringTasks = async () => {
    if (user) {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, 'tasks'),
          where('userId', '==', user.uid),
          where('isRecurring', '==', true)
        );
        
        const snapshot = await getDocs(q);
        const tasks = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Task[];
        
        setRecurringTasks(tasks);
      } catch (error) {
        console.error('Error fetching recurring tasks:', error);
        message.error('Failed to load recurring tasks');
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchRecurringTasks();
  }, [user]);

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    
    try {
      const taskRef = doc(db, 'tasks', taskToDelete);
      await deleteDoc(taskRef);
      
      // Update local state
      setRecurringTasks(prev => prev.filter(task => task.id !== taskToDelete));
      message.success('Recurring task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      message.error('Failed to delete recurring task');
    } finally {
      setTaskToDelete(null);
      setDeleteModalVisible(false);
    }
  };

  const showDeleteConfirm = (taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteModalVisible(true);
  };

  const handleToggleActive = async (taskId: string, currentIsActive: boolean) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { isActive: !currentIsActive });
      
      // Update local state
      setRecurringTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, isActive: !currentIsActive } 
          : task
      ));
      
      message.success(`Task ${!currentIsActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling task active status:', error);
      message.error('Failed to update task status');
    }
  };

  const handleProcessRecurringTasks = async () => {
    if (user) {
      setProcessing(true);
      try {
        await processRecurringTasks(user.uid);
        message.success('Recurring tasks processed successfully!');
        
        // Refresh the list
        const q = query(
          collection(db, 'tasks'),
          where('userId', '==', user.uid),
          where('isRecurring', '==', true)
        );
        
        const snapshot = await getDocs(q);
        const tasks = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Task[];
        
        setRecurringTasks(tasks);
      } catch (error) {
        console.error('Error processing recurring tasks:', error);
        message.error('Error processing recurring tasks');
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
      message.error('Failed to log out');
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        let color = 'green';
        if (priority === 'high') color = 'red';
        else if (priority === 'medium') color = 'orange';
        
        return (
          <Tag color={color} key={priority}>
            {priority.toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'Frequency',
      dataIndex: ['recurrencePattern', 'frequency'],
      key: 'frequency',
      render: (frequency: string) => frequency || 'daily'
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record: any) => (
        <Switch
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          checked={record.isActive !== false}
          onChange={checked => handleToggleActive(record.id, !checked)}
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: any) => (
        <Tooltip title="Delete">
          <Button 
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => showDeleteConfirm(record.id)}
          />
        </Tooltip>
      )
    }
  ];

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
          defaultSelectedKeys={['3']}
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
            <SettingOutlined /> Recurring Tasks
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
                      fetchRecurringTasks();
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
                      fetchRecurringTasks();
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
                    message="Recurring Tasks Management"
                    description="Recurring tasks automatically create new task instances based on their frequency. Use this page to manage your recurring tasks."
                    type="info"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />
                  <Button 
                    type="primary" 
                    icon={<SyncOutlined spin={processing} />}
                    loading={processing}
                    onClick={handleProcessRecurringTasks}
                  >
                    Process Recurring Tasks Now
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
          
          <Row gutter={[16, 16]}>
            <Col span={24} lg={12}>
              <RecurringTaskForm userId={user.uid} onTaskAdded={() => fetchRecurringTasks()} />
            </Col>
            <Col span={24} lg={12}>
              <Card title="Your Recurring Tasks" className="analytics-card">
                {isLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                    <Spin size="large" />
                  </div>
                ) : recurringTasks.length === 0 ? (
                  <Empty description="No recurring tasks found" />
                ) : (
                  <Table 
                    dataSource={recurringTasks}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                  />
                )}
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
      
      <Modal
        title="Delete Recurring Task"
        open={deleteModalVisible}
        onOk={handleDeleteTask}
        onCancel={() => setDeleteModalVisible(false)}
        okText="Yes, Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this recurring task?</p>
        <p>This will remove the recurring task pattern, but won't delete any existing task instances that were already created.</p>
      </Modal>
    </Layout>
  );
};

export default AdminPage;

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