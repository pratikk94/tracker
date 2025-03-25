'use client';

import React from 'react';
import { Card, Tag, Typography, Space, Button, Tooltip, Progress } from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  SyncOutlined,
  DeleteOutlined,
  EditOutlined,
  CoffeeOutlined,
  DropboxOutlined,
  CalendarOutlined,
  BellOutlined
} from '@ant-design/icons';
import { Task, TaskStatus } from '@/lib/types';
import { format, parseISO, isPast } from 'date-fns';

const { Text, Paragraph } = Typography;

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onDelete?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
}

const statusColors = {
  'todo': '#ff4d4f',
  'in-progress': '#1890ff',
  'completed': '#52c41a'
};

const statusIcons = {
  'todo': <ClockCircleOutlined />,
  'in-progress': <SyncOutlined spin />,
  'completed': <CheckCircleOutlined />
};

const typeIcons = {
  'meal': <CoffeeOutlined />,
  'water': <DropboxOutlined />,
  'schedule': <CalendarOutlined />,
  'task': <BellOutlined />
};

export default function TaskCard({ task, onStatusChange, onDelete, onEdit }: TaskCardProps) {
  const isOverdue = isPast(parseISO(task.deadline)) && task.status !== 'completed';
  
  const getStatusProgress = (status: TaskStatus) => {
    switch (status) {
      case 'todo': return 0;
      case 'in-progress': return 50;
      case 'completed': return 100;
      default: return 0;
    }
  };

  return (
    <Card
      style={{ 
        marginBottom: '16px',
        borderLeft: `4px solid ${statusColors[task.status]}`,
        backgroundColor: task.status === 'completed' ? 'rgba(82, 196, 26, 0.1)' : undefined,
        opacity: task.status === 'completed' ? 0.8 : 1
      }}
      bodyStyle={{ padding: '12px' }}
    >
      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Tag 
          icon={statusIcons[task.status]} 
          color={task.status === 'completed' ? 'success' : task.status === 'in-progress' ? 'processing' : 'error'}
          style={{ marginRight: '0' }}
        >
          {task.status.toUpperCase()}
        </Tag>
        {task.type && (
          <Tag icon={typeIcons[task.type as keyof typeof typeIcons]}>
            {task.type.toUpperCase()}
          </Tag>
        )}
        <Tag color={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'orange' : 'green'}>
          {task.priority.toUpperCase()}
        </Tag>
      </div>

      <Paragraph 
        strong 
        style={{ 
          marginBottom: '8px',
          textDecoration: task.status === 'completed' ? 'line-through' : 'none'
        }}
      >
        {task.title}
      </Paragraph>

      {task.description && (
        <Paragraph type="secondary" style={{ marginBottom: '12px' }}>
          {task.description}
        </Paragraph>
      )}

      <div style={{ marginBottom: '12px' }}>
        <Progress 
          percent={getStatusProgress(task.status)} 
          size="small" 
          status={
            task.status === 'completed' ? 'success' : 
            task.status === 'in-progress' ? 'active' : 
            isOverdue ? 'exception' : 'normal'
          }
          showInfo={false}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Tooltip title="Change Status">
            <Button 
              size="small" 
              type="text"
              onClick={() => {
                if (onStatusChange) {
                  const nextStatus: { [key in TaskStatus]: TaskStatus } = {
                    'todo': 'in-progress',
                    'in-progress': 'completed',
                    'completed': 'todo'
                  };
                  onStatusChange(task.id, nextStatus[task.status]);
                }
              }}
              icon={statusIcons[task.status]}
            />
          </Tooltip>
          {onEdit && (
            <Tooltip title="Edit">
              <Button 
                size="small" 
                type="text" 
                onClick={() => onEdit(task)}
                icon={<EditOutlined />}
              />
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete">
              <Button 
                size="small" 
                type="text" 
                danger
                onClick={() => onDelete(task.id)}
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          )}
        </Space>
        <Tooltip title={format(parseISO(task.deadline), 'PPP p')}>
          <Text type={isOverdue ? 'danger' : 'secondary'} style={{ fontSize: '12px' }}>
            <ClockCircleOutlined style={{ marginRight: '4px' }} />
            {format(parseISO(task.deadline), 'MMM d, h:mm a')}
          </Text>
        </Tooltip>
      </div>
    </Card>
  );
} 