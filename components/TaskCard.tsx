'use client';

import React, { useState, useContext } from 'react';
import { Card, Typography, Tag, Button, Modal, Form, Input, Select, DatePicker, Popconfirm, Space, message } from 'antd';
import { EditOutlined, DeleteOutlined, ClockCircleOutlined, CalendarOutlined, SyncOutlined, CoffeeOutlined, DropboxOutlined } from '@ant-design/icons';
import { Task } from '@/lib/types';
import { updateTask, deleteTask } from '@/lib/taskService';
import { format, isPast, parseISO } from 'date-fns';
import dayjs from 'dayjs';
import { ThemeContext } from '@/app/providers';

const { Text, Paragraph, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface TaskCardProps {
  task: Task;
  onTaskUpdated: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onTaskUpdated }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleEdit = () => {
    form.setFieldsValue({
      title: task.title,
      description: task.description,
      priority: task.priority,
      deadline: dayjs(task.deadline)
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      
      await updateTask(task.id, {
        title: values.title,
        description: values.description,
        priority: values.priority,
        deadline: values.deadline.toISOString()
      });
      
      message.success('Task updated successfully');
      setIsEditing(false);
      onTaskUpdated();
    } catch (error) {
      console.error('Error updating task:', error);
      message.error('Failed to update task');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setConfirmLoading(true);
      await deleteTask(task.id);
      message.success('Task deleted successfully');
      onTaskUpdated();
    } catch (error) {
      console.error('Error deleting task:', error);
      message.error('Failed to delete task');
    } finally {
      setConfirmLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDeadline = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  const isDeadlinePassed = task.deadline ? isPast(parseISO(task.deadline)) && task.status !== 'completed' : false;

  return (
    <>
      <Card 
        className="task-card" 
        size="small"
        style={{ 
          opacity: task.status === 'completed' ? 0.7 : 1,
          borderLeft: `4px solid ${
            task.priority === 'high' ? '#ff4d4f' :
            task.priority === 'medium' ? '#faad14' : '#52c41a'
          }`,
          backgroundColor: isDarkMode ? '#1f1f1f' : '#fff',
          color: isDarkMode ? '#fff' : 'inherit'
        }}
        actions={[
          <Button key="edit" type="text" icon={<EditOutlined />} onClick={handleEdit} />,
          <Popconfirm
            key="delete"
            title="Delete this task?"
            description="This action cannot be undone"
            onConfirm={handleDelete}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ]}
      >
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <Title level={5} style={{ margin: 0, color: isDarkMode ? '#fff' : 'inherit' }}>
              {task.type === 'meal' && <CoffeeOutlined style={{ marginRight: '8px' }} />}
              {task.type === 'sleep' && <ClockCircleOutlined style={{ marginRight: '8px' }} />}
              {task.type === 'water' && <DropboxOutlined style={{ marginRight: '8px' }} />}
              {task.type === 'schedule' && <CalendarOutlined style={{ marginRight: '8px' }} />}
              {task.title}
            </Title>
            <Tag color={getPriorityColor(task.priority)}>
              {task.priority.toUpperCase()}
            </Tag>
          </div>
          <Paragraph 
            ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}
            style={{ marginBottom: '8px', color: isDarkMode ? '#d9d9d9' : 'inherit' }}
          >
            {task.description}
          </Paragraph>
          <div>
            <Text 
              type={isDeadlinePassed ? "danger" : "secondary"} 
              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', color: isDarkMode && !isDeadlinePassed ? '#a0a0a0' : undefined }}
            >
              <CalendarOutlined style={{ marginRight: '4px' }} />
              {formatDeadline(task.deadline)}
              {isDeadlinePassed && <Tag color="error" style={{ marginLeft: '4px', fontSize: '10px' }}>Overdue</Tag>}
            </Text>
          </div>
          {task.isRecurring && (
            <div style={{ marginTop: '4px' }}>
              <Tag color="processing" icon={<SyncOutlined spin />} style={{ fontSize: '11px' }}>
                Recurring {task.recurrencePattern?.frequency || 'daily'}
              </Tag>
            </div>
          )}
        </div>
      </Card>

      <Modal
        title="Edit Task"
        open={isEditing}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleSave}
            loading={confirmLoading}
          >
            Save
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          name="editTask"
          initialValues={{
            title: task.title,
            description: task.description,
            priority: task.priority,
            deadline: dayjs(task.deadline)
          }}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={4} />
          </Form.Item>
          
          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true, message: 'Please select a priority' }]}
          >
            <Select>
              <Option value="high">High</Option>
              <Option value="medium">Medium</Option>
              <Option value="low">Low</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="deadline"
            label="Deadline"
            rules={[{ required: true, message: 'Please select a deadline' }]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default TaskCard; 