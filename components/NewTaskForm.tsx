'use client';

import React, { useState, useContext } from 'react';
import { Form, Input, Button, Select, DatePicker, Switch, Radio, Space, message } from 'antd';
import { PlusOutlined, ClockCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { createTask } from '@/lib/taskService';
import { Task, TaskPriority, TaskStatus } from '@/lib/types';
import dayjs from 'dayjs';
import { ThemeContext } from '@/app/providers';

const { TextArea } = Input;
const { Option } = Select;

interface NewTaskFormProps {
  userId: string;
  onTaskAdded: () => void;
  onCancel: () => void;
}

const NewTaskForm: React.FC<NewTaskFormProps> = ({ userId, onTaskAdded, onCancel }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [form] = Form.useForm();
  const [isRecurring, setIsRecurring] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values: any) => {
    try {
      setLoading(true);
      
      const taskData: Omit<Task, 'id' | 'createdAt'> = {
        title: values.title,
        description: values.description || '',
        status: 'todo' as TaskStatus,
        priority: values.priority as TaskPriority,
        deadline: values.deadline.toISOString(),
        userId,
        isRecurring: values.isRecurring || false,
        completedAt: null
      };
      
      if (values.isRecurring) {
        taskData.recurrencePattern = {
          frequency: values.frequency,
          interval: 1,
        };
      }
      
      await createTask(taskData);
      form.resetFields();
      message.success('Task created successfully');
      onTaskAdded();
    } catch (error) {
      console.error('Error creating task:', error);
      message.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{
        priority: 'medium',
        deadline: dayjs().add(1, 'day').startOf('day'),
        isRecurring: false,
        frequency: 'daily'
      }}
      style={{ color: isDarkMode ? '#fff' : 'inherit' }}
    >
      <Form.Item
        name="title"
        label="Task Title"
        rules={[{ required: true, message: 'Please enter a task title' }]}
      >
        <Input placeholder="Enter task title" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
      >
        <TextArea 
          rows={4} 
          placeholder="Enter task description (optional)"
        />
      </Form.Item>

      <Form.Item
        name="priority"
        label="Priority"
        rules={[{ required: true, message: 'Please select a priority' }]}
      >
        <Select>
          <Option value="high">
            <span style={{ color: '#ff4d4f' }}>● </span>
            High
          </Option>
          <Option value="medium">
            <span style={{ color: '#faad14' }}>● </span>
            Medium
          </Option>
          <Option value="low">
            <span style={{ color: '#52c41a' }}>● </span>
            Low
          </Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="deadline"
        label="Deadline"
        rules={[{ required: true, message: 'Please select a deadline' }]}
      >
        <DatePicker 
          showTime 
          format="YYYY-MM-DD HH:mm" 
          style={{ width: '100%' }} 
          placeholder="Select date and time"
        />
      </Form.Item>

      <Form.Item 
        name="isRecurring" 
        label="Recurring Task" 
        valuePropName="checked"
      >
        <Switch 
          onChange={(checked) => setIsRecurring(checked)} 
          checkedChildren={<SyncOutlined />}
        />
      </Form.Item>

      {isRecurring && (
        <Form.Item
          name="frequency"
          label="Repeat Frequency"
          rules={[{ required: isRecurring, message: 'Please select a frequency' }]}
        >
          <Radio.Group>
            <Space direction="vertical">
              <Radio value="daily">Daily</Radio>
              <Radio value="weekly">Weekly</Radio>
              <Radio value="monthly">Monthly</Radio>
            </Space>
          </Radio.Group>
        </Form.Item>
      )}

      <Form.Item>
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit"
            loading={loading}
            icon={<PlusOutlined />}
          >
            Create Task
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default NewTaskForm; 