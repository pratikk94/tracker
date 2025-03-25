'use client';

import React from 'react';
import { List, Spin } from 'antd';
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