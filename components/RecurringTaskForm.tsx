'use client';

import React, { useState, useContext } from 'react';
import { Form, Input, Button, Select, DatePicker, Radio, Space, message, Card, Typography } from 'antd';
import { SyncOutlined, SaveOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { createTask } from '@/lib/taskService';
import { Task, TaskPriority, TaskStatus } from '@/lib/types';
import dayjs from 'dayjs';
import { ThemeContext } from '@/app/providers';

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

interface RecurringTaskFormProps {
  userId: string;
  onTaskAdded: () => void;
}

const RecurringTaskForm: React.FC<RecurringTaskFormProps> = ({ userId, onTaskAdded }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [form] = Form.useForm();
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
        isRecurring: true,
        isActive: true,
        completedAt: null,
        recurrencePattern: {
          frequency: values.frequency,
          interval: values.interval || 1,
          endDate: values.endDate ? values.endDate.toISOString() : undefined
        }
      };
      
      await createTask(taskData);
      form.resetFields();
      message.success('Recurring task created successfully');
      onTaskAdded();
    } catch (error) {
      console.error('Error creating recurring task:', error);
      message.error('Failed to create recurring task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <SyncOutlined style={{ marginRight: '8px' }} />
          <span>Create New Recurring Task</span>
        </div>
      }
      style={{ marginBottom: '24px' }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          priority: 'medium',
          deadline: dayjs().add(1, 'day').startOf('day'),
          frequency: 'daily',
          interval: 1
        }}
      >
        <Form.Item
          name="title"
          label="Task Title"
          rules={[{ required: true, message: 'Please enter a task title' }]}
        >
          <Input placeholder="Enter recurring task title" />
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
          label="First Occurrence Deadline"
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
          name="frequency"
          label="Repeat Frequency"
          rules={[{ required: true, message: 'Please select a frequency' }]}
        >
          <Radio.Group>
            <Space direction="vertical">
              <Radio value="daily">Daily</Radio>
              <Radio value="weekly">Weekly</Radio>
              <Radio value="monthly">Monthly</Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="interval"
          label="Repeat Every"
          rules={[{ required: true, message: 'Please specify an interval' }]}
        >
          <Select style={{ width: '120px' }}>
            {[...Array(30)].map((_, i) => (
              <Option key={i + 1} value={i + 1}>{i + 1}</Option>
            ))}
          </Select>
          <span style={{ marginLeft: '8px' }}>
            {form.getFieldValue('frequency') === 'daily' ? 'days' : 
             form.getFieldValue('frequency') === 'weekly' ? 'weeks' : 'months'}
          </span>
        </Form.Item>

        <Form.Item
          name="endDate"
          label="End Date (Optional)"
        >
          <DatePicker 
            format="YYYY-MM-DD" 
            style={{ width: '100%' }} 
            placeholder="Select end date (leave empty for no end date)"
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit"
            loading={loading}
            icon={<SaveOutlined />}
          >
            Create Recurring Task
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default RecurringTaskForm; 