'use client';

import React, { useState, useContext } from 'react';
import { Layout, Menu, Button, Typography, Card, Row, Col, Space, Modal } from 'antd';
import { 
  PlusOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  DashboardOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  LogoutOutlined,
  BellOutlined,
  DropboxOutlined,
  CoffeeOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { ThemeContext } from '@/app/providers';
import { Task, TaskStatus } from '@/lib/types';
import { getTasks, updateTask, deleteTask } from '@/lib/taskService';
import TaskListView from '@/components/TaskListView';
import KanbanBoard from '../components/KanbanBoard';
import TaskForm from '../components/TaskForm';
import Loading from '../loading';
import Link from 'next/link';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { isDarkMode } = useContext(ThemeContext);
  const [collapsed, setCollapsed] = useState(false);
  const [tasks, setTasks] = useState<{ [key in TaskStatus]: Task[] }>({
    'todo': [],
    'in-progress': [],
    'completed': []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  React.useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const fetchedTasks = await getTasks(user.uid);
        const groupedTasks = fetchedTasks.reduce((acc, task) => {
          if (!acc[task.status]) acc[task.status] = [];
          acc[task.status].push(task);
          return acc;
        }, {} as { [key in TaskStatus]: Task[] });

        setTasks({
          'todo': groupedTasks['todo'] || [],
          'in-progress': groupedTasks['in-progress'] || [],
          'completed': groupedTasks['completed'] || []
        });
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !user) return;

    const sourceStatus = result.source.droppableId as TaskStatus;
    const destStatus = result.destination.droppableId as TaskStatus;
    const taskId = result.draggableId;

    const taskToMove = tasks[sourceStatus].find(t => t.id === taskId);
    if (!taskToMove) return;

    // Optimistically update UI
    const newTasks = { ...tasks };
    newTasks[sourceStatus] = tasks[sourceStatus].filter(t => t.id !== taskId);
    newTasks[destStatus] = [...tasks[destStatus], { ...taskToMove, status: destStatus }];
    setTasks(newTasks);

    try {
      await updateTask(taskId, { status: destStatus });
    } catch (error) {
      console.error('Error updating task status:', error);
      // Revert on error
      setTasks(tasks);
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      const fetchedTasks = await getTasks(user!.uid);
      const groupedTasks = fetchedTasks.reduce((acc, task) => {
        if (!acc[task.status]) acc[task.status] = [];
        acc[task.status].push(task);
        return acc;
      }, {} as { [key in TaskStatus]: Task[] });

      setTasks({
        'todo': groupedTasks['todo'] || [],
        'in-progress': groupedTasks['in-progress'] || [],
        'completed': groupedTasks['completed'] || []
      });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      const fetchedTasks = await getTasks(user!.uid);
      const groupedTasks = fetchedTasks.reduce((acc, task) => {
        if (!acc[task.status]) acc[task.status] = [];
        acc[task.status].push(task);
        return acc;
      }, {} as { [key in TaskStatus]: Task[] });

      setTasks({
        'todo': groupedTasks['todo'] || [],
        'in-progress': groupedTasks['in-progress'] || [],
        'completed': groupedTasks['completed'] || []
      });
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleWakeUp = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/logs/wakeup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      });
      if (!response.ok) {
        throw new Error('Failed to log wake up time');
      }
    } catch (error) {
      console.error('Error logging wake-up time:', error);
    }
  };

  const handleWater = async () => {
    if (!user) return;
    try {
      const waterTaskData = {
        title: 'Drink Water (250ml)',
        description: 'Remember to stay hydrated!',
        status: 'todo',
        priority: 'medium',
        deadline: new Date().toISOString(),
        userId: user.uid,
        type: 'water',
      };
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(waterTaskData),
      });
      if (!response.ok) {
        throw new Error('Failed to add water intake reminder');
      }
    } catch (error) {
      console.error('Error adding water intake:', error);
    }
  };

  const handleMeal = async () => {
    if (!user) return;
    try {
      const mealTaskData = {
        title: 'Meal Time',
        description: 'Time for your scheduled meal',
        status: 'todo',
        priority: 'high',
        deadline: new Date().toISOString(),
        userId: user.uid,
        type: 'meal',
      };
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mealTaskData),
      });
      if (!response.ok) {
        throw new Error('Failed to add meal reminder');
      }
    } catch (error) {
      console.error('Error adding meal reminder:', error);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={value => setCollapsed(value)}
        theme={isDarkMode ? 'dark' : 'light'}
        style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.05)' }}
      >
        <div style={{ 
          padding: '16px',
          textAlign: 'center',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: '8px'
        }}>
          {!collapsed && <Title level={4} style={{ margin: 0 }}>Task Tracker</Title>}
        </div>
        <Menu
          theme={isDarkMode ? 'dark' : 'light'}
          mode="inline"
          defaultSelectedKeys={['1']}
          items={[
            {
              key: '1',
              icon: <DashboardOutlined />,
              label: <Link href="/dashboard">Dashboard</Link>
            },
            {
              key: '2',
              icon: <BarChartOutlined />,
              label: <Link href="/analytics">Analytics</Link>
            },
            {
              key: '3',
              icon: <ClockCircleOutlined />,
              label: <Link href="/recurring-tasks">Recurring Tasks</Link>
            },
            {
              key: '4',
              icon: <HeartOutlined />,
              label: <Link href="/lifestyle">Lifestyle</Link>
            }
          ]}
        />
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          danger
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            width: 'calc(100% - 32px)'
          }}
        >
          {!collapsed && 'Logout'}
        </Button>
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
          <Title level={4} style={{ margin: 0, color: isDarkMode ? '#fff' : '#000' }}>
            Task Dashboard
          </Title>
          <Space>
            <Button type="text" icon={<BellOutlined />} onClick={handleWakeUp}>
              Wake Up
            </Button>
            <Button type="text" icon={<DropboxOutlined />} onClick={handleWater}>
              Water
            </Button>
            <Button type="text" icon={<CoffeeOutlined />} onClick={handleMeal}>
              Meal
            </Button>
            <span style={{ color: isDarkMode ? '#fff' : '#000' }}>
              <UserOutlined style={{ marginRight: '8px' }} />
              {user?.email}
            </span>
          </Space>
        </Header>
        <Content style={{ padding: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <Button 
                      type={viewMode === 'kanban' ? 'primary' : 'default'}
                      icon={<AppstoreOutlined />}
                      onClick={() => setViewMode('kanban')}
                    >
                      Kanban View
                    </Button>
                    <Button 
                      type={viewMode === 'list' ? 'primary' : 'default'}
                      icon={<UnorderedListOutlined />}
                      onClick={() => setViewMode('list')}
                    >
                      List View
                    </Button>
                  </Space>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => {
                      setEditingTask(null);
                      setIsTaskFormOpen(true);
                    }}
                  >
                    New Task
                  </Button>
                </div>
              </Card>
            </Col>
          </Row>
          
          <Row gutter={[16, 16]} style={{ marginTop: '16px' }} className="kanban-container">
            {viewMode === 'kanban' ? (
              <KanbanBoard
                tasks={tasks}
                onDragEnd={handleDragEnd}
                onTaskStatusChange={handleTaskStatusChange}
                onTaskDelete={handleTaskDelete}
                onTaskEdit={handleTaskEdit}
              />
            ) : (
              <Col span={24}>
                <TaskListView
                  tasks={[...tasks.todo, ...tasks['in-progress'], ...tasks.completed]}
                  loading={isLoading}
                  onTaskUpdated={async () => {
                    const fetchedTasks = await getTasks(user!.uid);
                    const groupedTasks = fetchedTasks.reduce((acc, task) => {
                      if (!acc[task.status]) acc[task.status] = [];
                      acc[task.status].push(task);
                      return acc;
                    }, {} as { [key in TaskStatus]: Task[] });

                    setTasks({
                      'todo': groupedTasks['todo'] || [],
                      'in-progress': groupedTasks['in-progress'] || [],
                      'completed': groupedTasks['completed'] || []
                    });
                  }}
                  onTaskDeleted={handleTaskDelete}
                  onStatusChange={handleTaskStatusChange}
                />
              </Col>
            )}
          </Row>

          <Modal
            title={editingTask ? 'Edit Task' : 'Add New Task'}
            open={isTaskFormOpen}
            onCancel={() => {
              setIsTaskFormOpen(false);
              setEditingTask(null);
            }}
            footer={null}
            width={600}
          >
            <TaskForm
              open={isTaskFormOpen}
              onClose={() => {
                setIsTaskFormOpen(false);
                setEditingTask(null);
              }}
              onSuccess={async () => {
                setIsTaskFormOpen(false);
                setEditingTask(null);
                const fetchedTasks = await getTasks(user!.uid);
                const groupedTasks = fetchedTasks.reduce((acc, task) => {
                  if (!acc[task.status]) acc[task.status] = [];
                  acc[task.status].push(task);
                  return acc;
                }, {} as { [key in TaskStatus]: Task[] });

                setTasks({
                  'todo': groupedTasks['todo'] || [],
                  'in-progress': groupedTasks['in-progress'] || [],
                  'completed': groupedTasks['completed'] || []
                });
              }}
              editingTask={editingTask}
            />
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
} 