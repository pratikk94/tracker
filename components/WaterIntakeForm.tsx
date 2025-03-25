'use client';

import React, { useState, useContext } from 'react';
import { Form, Button, DatePicker, TimePicker, Radio, Space, message, Card, Typography, Switch, Select, InputNumber } from 'antd';
import { DropboxOutlined, SaveOutlined } from '@ant-design/icons';
import { createWaterIntake } from '@/lib/taskService';
import { RecurrencePattern } from '@/lib/types';
import dayjs from 'dayjs';
import { ThemeContext } from '@/app/providers';

const { Option } = Select;
const { Title } = Typography;

interface WaterIntakeFormProps {
  userId: string;
  onWaterAdded: () => void;
}

const WaterIntakeForm: React.FC<WaterIntakeFormProps> = ({ userId, onWaterAdded }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  const handleFinish = async (values: any) => {
    try {
      setLoading(true);
      
      const waterData: any = {
        amount: values.amount,
        time: values.time.toISOString(),
        date: values.date.format('YYYY-MM-DD'),
        userId,
        isRecurring: values.isRecurring,
      };
      
      if (values.isRecurring) {
        waterData.recurrencePattern = {
          frequency: values.frequency,
          interval: values.interval || 1,
          endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined
        } as RecurrencePattern;
      }
      
      await createWaterIntake(waterData);
      form.resetFields();
      message.success('Water intake reminder added successfully');
      onWaterAdded();
    } catch (error) {
      console.error('Error creating water intake reminder:', error);
      message.error('Failed to add water intake reminder');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [
    { label: '1 Glass (250ml)', value: 250 },
    { label: '1 Bottle (500ml)', value: 500 },
    { label: '1 Liter', value: 1000 },
    { label: '2 Liters', value: 2000 },
  ];

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <DropboxOutlined style={{ marginRight: '8px' }} />
          <span>Water Intake Reminder</span>
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
          time: dayjs(),
          amount: 250,
          isRecurring: false,
          frequency: 'daily',
          interval: 1
        }}
      >
        <Form.Item
          name="amount"
          label="Amount (ml)"
          rules={[{ required: true, message: 'Please enter amount' }]}
        >
          <InputNumber 
            min={50} 
            max={5000}
            style={{ width: '100%' }}
            addonAfter="ml"
          />
        </Form.Item>

        <Form.Item label="Quick Select">
          <Space wrap>
            {quickAmounts.map((item) => (
              <Button 
                key={item.value}
                onClick={() => form.setFieldsValue({ amount: item.value })}
              >
                {item.label}
              </Button>
            ))}
          </Space>
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
          name="time"
          label="Time"
          rules={[{ required: true, message: 'Please select a time' }]}
        >
          <TimePicker
            format="HH:mm"
            style={{ width: '100%' }}
            placeholder="When to drink water?"
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
            Add Water Reminder
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default WaterIntakeForm; 