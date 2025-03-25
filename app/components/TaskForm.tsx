'use client';

import React, { useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, Space } from 'antd';
import { Task, TaskStatus, TaskPriority } from '@/lib/types';
import dayjs from 'dayjs';
import { useAuth } from '@/lib/AuthContext';

const { TextArea } = Input;
const { Option } = Select;

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTask?: Task | null;
}

export default function TaskForm({ open, onClose, onSuccess, editingTask }: TaskFormProps) {
  const [form] = Form.useForm();
  const { user } = useAuth();

  useEffect(() => {
    if (editingTask) {
      form.setFieldsValue({
        ...editingTask,
        deadline: dayjs(editingTask.deadline)
      });
    } else {
      form.resetFields();
    }
  }, [editingTask, form]);

  const handleSubmit = async (values: any) => {
    try {
      const taskData = {
        ...values,
        userId: user?.uid,
        deadline: values.deadline.toISOString()
      };

      const endpoint = '/api/tasks';
      const method = editingTask ? 'PUT' : 'POST';
      const url = editingTask ? `${endpoint}/${editingTask.id}` : endpoint;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error('Failed to save task');
      }

      onSuccess();
      form.resetFields();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        status: 'todo',
        priority: 'medium',
        type: 'task'
      }}
    >
      <Form.Item
        name="title"
        label="Title"
        rules={[{ required: true, message: 'Please enter a title' }]}
      >
        <Input placeholder="Task title" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
      >
        <TextArea rows={4} placeholder="Task description" />
      </Form.Item>

      <Form.Item
        name="status"
        label="Status"
        rules={[{ required: true }]}
      >
        <Select>
          <Option value="todo">To Do</Option>
          <Option value="in-progress">In Progress</Option>
          <Option value="completed">Completed</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="priority"
        label="Priority"
        rules={[{ required: true }]}
      >
        <Select>
          <Option value="low">Low</Option>
          <Option value="medium">Medium</Option>
          <Option value="high">High</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="type"
        label="Type"
        rules={[{ required: true }]}
      >
        <Select>
          <Option value="task">Task</Option>
          <Option value="meal">Meal</Option>
          <Option value="water">Water</Option>
          <Option value="schedule">Schedule</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="deadline"
        label="Deadline"
        rules={[{ required: true, message: 'Please select a deadline' }]}
      >
        <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            {editingTask ? 'Update Task' : 'Add Task'}
          </Button>
          <Button onClick={onClose}>
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
} 