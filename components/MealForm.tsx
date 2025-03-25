'use client';

import React, { useState, useContext } from 'react';
import { Form, Input, Button, Select, DatePicker, TimePicker, Radio, Space, message, Card, Typography, InputNumber, Switch, Row, Col, Alert } from 'antd';
import { CoffeeOutlined, SaveOutlined, SyncOutlined, ExperimentOutlined, RocketOutlined } from '@ant-design/icons';
import { createMeal } from '@/lib/taskService';
import { RecurrencePattern } from '@/lib/types';
import dayjs from 'dayjs';
import { ThemeContext } from '@/app/providers';

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

interface MealFormProps {
  userId: string;
  onMealAdded: () => void;
}

const MealForm: React.FC<MealFormProps> = ({ userId, onMealAdded }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [mealType, setMealType] = useState('regular');

  const handleFinish = async (values: any) => {
    try {
      setLoading(true);
      
      const mealData: any = {
        title: values.title,
        description: values.description || '',
        time: values.time.toISOString(),
        date: values.date.format('YYYY-MM-DD'),
        calories: values.calories,
        userId,
        isRecurring: values.isRecurring,
        mealType: values.mealType
      };
      
      if (values.isRecurring) {
        mealData.recurrencePattern = {
          frequency: values.frequency,
          interval: values.interval || 1,
          endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined
        } as RecurrencePattern;
      }
      
      await createMeal(mealData);
      form.resetFields();
      message.success('Meal added successfully');
      onMealAdded();
    } catch (error) {
      console.error('Error creating meal:', error);
      message.error('Failed to add meal');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMeal = async (type: string) => {
    try {
      setLoading(true);
      
      let title, description, time;
      
      if (type === 'breakfast') {
        title = 'Breakfast';
        description = 'Morning meal (8:00 AM)';
        time = dayjs().hour(8).minute(0).second(0).toISOString();
      } else if (type === 'dinner') {
        title = 'Dinner';
        description = 'Evening meal (4:00 PM)';
        time = dayjs().hour(16).minute(0).second(0).toISOString();
      } else if (type === 'detox') {
        title = 'Morning Detox Drink';
        description = 'Take immediately after waking up';
        time = dayjs().hour(6).minute(30).second(0).toISOString();
      } else if (type === 'preworkout') {
        title = 'Pre-Workout Drink';
        description = 'Take 30 minutes before workout';
        time = dayjs().hour(10).minute(0).second(0).toISOString();
      } else if (type === 'postworkout') {
        title = 'Post-Workout Drink';
        description = 'Take within 30 minutes after workout';
        time = dayjs().hour(12).minute(0).second(0).toISOString();
      }
      
      const mealData: any = {
        title,
        description,
        time,
        date: dayjs().format('YYYY-MM-DD'),
        calories: 0,
        userId,
        isRecurring: true,
        mealType: type === 'breakfast' || type === 'dinner' ? 'regular' : 'supplement',
        recurrencePattern: {
          frequency: 'daily',
          interval: 1
        }
      };
      
      await createMeal(mealData);
      message.success(`${title} added successfully`);
      onMealAdded();
    } catch (error) {
      console.error('Error creating quick meal:', error);
      message.error('Failed to add meal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CoffeeOutlined style={{ marginRight: '8px' }} />
          <span>Add Meal</span>
        </div>
      }
      style={{ marginBottom: '24px' }}
    >
      <Alert
        message="Meal Plan"
        description="The meal plan consists of two daily meals (8 AM and 4 PM) with supplementation including a morning detox drink and pre/post workout drinks."
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />
      
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col span={24}>
          <Card title="Quick Add" size="small">
            <Space wrap>
              <Button 
                type="primary" 
                icon={<CoffeeOutlined />} 
                onClick={() => handleQuickMeal('breakfast')}
              >
                Breakfast (8 AM)
              </Button>
              <Button 
                type="primary" 
                icon={<CoffeeOutlined />} 
                onClick={() => handleQuickMeal('dinner')}
              >
                Dinner (4 PM)
              </Button>
              <Button 
                icon={<ExperimentOutlined />} 
                onClick={() => handleQuickMeal('detox')}
              >
                Morning Detox
              </Button>
              <Button 
                icon={<RocketOutlined />} 
                onClick={() => handleQuickMeal('preworkout')}
              >
                Pre-Workout
              </Button>
              <Button 
                icon={<RocketOutlined />} 
                onClick={() => handleQuickMeal('postworkout')}
              >
                Post-Workout
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          date: dayjs(),
          time: dayjs(),
          isRecurring: false,
          frequency: 'daily',
          interval: 1,
          mealType: 'regular'
        }}
      >
        <Form.Item
          name="title"
          label="Meal Name"
          rules={[{ required: true, message: 'Please enter a meal name' }]}
        >
          <Input placeholder="Enter meal name (e.g., Breakfast, Lunch, Dinner)" />
        </Form.Item>

        <Form.Item
          name="mealType"
          label="Meal Type"
        >
          <Select onChange={(value) => setMealType(value)}>
            <Option value="regular">Regular Meal</Option>
            <Option value="supplement">Supplement</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea 
            rows={2} 
            placeholder="Enter meal description or ingredients"
          />
        </Form.Item>

        <Form.Item
          name="calories"
          label="Calories (optional)"
        >
          <InputNumber 
            min={0} 
            placeholder="Calories" 
            style={{ width: '100%' }} 
            addonAfter="kcal"
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
          name="time"
          label="Time"
          rules={[{ required: true, message: 'Please select a time' }]}
          extra={
            <div style={{ marginTop: '8px' }}>
              <Button size="small" onClick={() => form.setFieldsValue({ time: dayjs().hour(8).minute(0) })}>
                Set to 8:00 AM (Breakfast)
              </Button>
              <Button size="small" style={{ marginLeft: '8px' }} onClick={() => form.setFieldsValue({ time: dayjs().hour(16).minute(0) })}>
                Set to 4:00 PM (Dinner)
              </Button>
            </div>
          }
        >
          <TimePicker
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
            Add Meal
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default MealForm; 