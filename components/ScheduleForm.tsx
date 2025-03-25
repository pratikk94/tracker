'use client';

import React, { useState, useContext } from 'react';
import { Form, Input, Button, DatePicker, TimePicker, Radio, Space, message, Card, Typography, Switch, Select } from 'antd';
import { CalendarOutlined, SaveOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { createSchedule } from '@/lib/taskService';
import { RecurrencePattern } from '@/lib/types';
import dayjs from 'dayjs';
import { ThemeContext } from '@/app/providers';

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;
const { RangePicker } = TimePicker;

interface ScheduleFormProps {
  userId: string;
  onScheduleAdded: () => void;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ userId, onScheduleAdded }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  const handleFinish = async (values: any) => {
    try {
      setLoading(true);
      
      const [startTime, endTime] = values.timeRange;
      
      const scheduleData: any = {
        title: values.title,
        description: values.description || '',
        location: values.location,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        date: values.date.format('YYYY-MM-DD'),
        userId,
        isRecurring: values.isRecurring,
      };
      
      if (values.isRecurring) {
        scheduleData.recurrencePattern = {
          frequency: values.frequency,
          interval: values.interval || 1,
          endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined
        } as RecurrencePattern;
      }
      
      await createSchedule(scheduleData);
      form.resetFields();
      message.success('Schedule added successfully');
      onScheduleAdded();
    } catch (error) {
      console.error('Error creating schedule:', error);
      message.error('Failed to add schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CalendarOutlined style={{ marginRight: '8px' }} />
          <span>Add Schedule Item</span>
        </div>
      }
      style={{ marginBottom: '24px' }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          date: dayjs(),
          timeRange: [dayjs().hour(9).minute(0), dayjs().hour(10).minute(0)],
          isRecurring: false,
          frequency: 'daily',
          interval: 1
        }}
      >
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: 'Please enter a title' }]}
        >
          <Input placeholder="Meeting, Class, Workout, etc." />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea 
            rows={2} 
            placeholder="Additional details"
          />
        </Form.Item>

        <Form.Item
          name="location"
          label="Location"
        >
          <Input 
            placeholder="Where is this taking place?"
            prefix={<EnvironmentOutlined />}
          />
        </Form.Item>

        <Form.Item
          name="date"
          label="Date"
          rules={[{ required: true, message: 'Please select a date' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        </Form.Item>

        <Form.Item
          name="timeRange"
          label="Time Range"
          rules={[{ required: true, message: 'Please select start and end time' }]}
        >
          <RangePicker 
            format="HH:mm"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="isRecurring"
          valuePropName="checked"
        >
          <Switch 
            checkedChildren="Recurring" 
            unCheckedChildren="One-time" 
            onChange={(checked) => setIsRecurring(checked)}
          />
        </Form.Item>

        {isRecurring && (
          <>
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

            <Form.Item
              name="interval"
              label="Repeat Every"
              rules={[{ required: isRecurring, message: 'Please specify an interval' }]}
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
              />
            </Form.Item>
          </>
        )}

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit"
            loading={loading}
            icon={<SaveOutlined />}
          >
            Add to Schedule
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ScheduleForm; 