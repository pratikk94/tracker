'use client';

import React, { useState, useContext } from 'react';
import { Form, Button, DatePicker, TimePicker, Radio, Space, message, Card, Typography, Switch, Select } from 'antd';
import { ClockCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { createSleep } from '@/lib/taskService';
import { RecurrencePattern } from '@/lib/types';
import dayjs from 'dayjs';
import { ThemeContext } from '@/app/providers';

const { Option } = Select;
const { Title } = Typography;

interface SleepFormProps {
  userId: string;
  onSleepAdded: () => void;
}

const SleepForm: React.FC<SleepFormProps> = ({ userId, onSleepAdded }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  const handleFinish = async (values: any) => {
    try {
      setLoading(true);
      
      const sleepData: any = {
        bedTime: values.bedTime.toISOString(),
        wakeTime: values.wakeTime.toISOString(),
        date: values.date.format('YYYY-MM-DD'),
        quality: values.quality,
        userId,
        isRecurring: values.isRecurring,
      };
      
      if (values.isRecurring) {
        sleepData.recurrencePattern = {
          frequency: values.frequency,
          interval: values.interval || 1,
          endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined
        } as RecurrencePattern;
      }
      
      await createSleep(sleepData);
      form.resetFields();
      message.success('Sleep schedule added successfully');
      onSleepAdded();
    } catch (error) {
      console.error('Error creating sleep schedule:', error);
      message.error('Failed to add sleep schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ClockCircleOutlined style={{ marginRight: '8px' }} />
          <span>Sleep Schedule</span>
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
          bedTime: dayjs().hour(22).minute(0),
          wakeTime: dayjs().add(1, 'day').hour(6).minute(0),
          isRecurring: false,
          frequency: 'daily',
          interval: 1,
          quality: 'good'
        }}
      >
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
          name="bedTime"
          label="Bedtime"
          rules={[{ required: true, message: 'Please select bedtime' }]}
        >
          <TimePicker
            format="HH:mm"
            style={{ width: '100%' }}
            placeholder="When do you go to bed?"
          />
        </Form.Item>

        <Form.Item
          name="wakeTime"
          label="Wake Time"
          rules={[{ required: true, message: 'Please select wake time' }]}
        >
          <TimePicker
            format="HH:mm"
            style={{ width: '100%' }}
            placeholder="When do you wake up?"
          />
        </Form.Item>

        <Form.Item
          name="quality"
          label="Sleep Quality (Optional)"
        >
          <Select style={{ width: '100%' }}>
            <Option value="poor">Poor</Option>
            <Option value="fair">Fair</Option>
            <Option value="good">Good</Option>
            <Option value="excellent">Excellent</Option>
          </Select>
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
            Save Sleep Schedule
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default SleepForm; 