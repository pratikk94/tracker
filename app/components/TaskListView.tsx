'use client';

import React from 'react';
import { List, Spin, Empty } from 'antd';
import { Task, TaskStatus } from '@/lib/types';
import TaskCard from './TaskCard';

interface TaskListViewProps {
  tasks: Task[];
  loading?: boolean;
  onTaskUpdated: () => void;
  onTaskDeleted: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

export default function TaskListView({
  tasks,
  loading = false,
  onTaskUpdated,
  onTaskDeleted,
  onStatusChange
}: TaskListViewProps) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Empty 
        description="No tasks found" 
        image={Empty.PRESENTED_IMAGE_SIMPLE} 
      />
    );
  }

  return (
    <List
      dataSource={tasks}
      renderItem={(task) => (
        <TaskCard
          key={task.id}
          task={task}
          onStatusChange={onStatusChange}
          onDelete={onTaskDeleted}
          onEdit={() => onTaskUpdated()}
        />
      )}
    />
  );
} 