'use client';

import React, { useEffect, useState, useContext, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ThemeContext } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { 
  Layout, Typography, Card, Row, Col, Spin, Select, Button, Empty, Statistic, Divider, Space, Alert, notification, Modal, Form, TimePicker, Table, Tag, InputNumber, Radio
} from 'antd';
import {
  DashboardOutlined,
  BarChartOutlined,
  LineChartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileAddOutlined,
  FileExclamationOutlined,
  LogoutOutlined,
  SettingOutlined,
  CalendarOutlined,
  CoffeeOutlined,
  DropboxOutlined,
  WarningOutlined,
  FileOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import ThemeToggle from '@/components/ThemeToggle';
import TaskListView from '@/components/TaskListView';
import { DailyLog, PerformanceMetric, TaskStatus, TaskPriority, Task } from '@/lib/types';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, subDays, parseISO, startOfDay, addDays, differenceInMinutes } from 'date-fns';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { getTasksByStatus, updateTask, deleteTask } from '@/lib/taskService';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const { Header, Sider, Content } = Layout;
const { Title: AntTitle, Paragraph, Text } = Typography;
const { Option } = Select;

// Chart colors that work in both light and dark modes
const chartColors = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  danger: '#ff4d4f',
  info: '#13c2c2',
  purple: '#722ed1',
  grey: '#8c8c8c'
};

// Add consistent card styles
const cardStyle = {
  background: '#1f1f1f',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  height: '100%',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
};

const metricCardStyle = {
  ...cardStyle,
  padding: '24px',
  textAlign: 'center' as const
};

const AnalyticsPage = () => {
  const { user, loading, logout } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const router = useRouter();
  const [metrics, setMetrics] = useState<PerformanceMetric | null>(null);
  const [tasksData, setTasksData] = useState({
    todoCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    overdue: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<string>("30");
  const [collapsed, setCollapsed] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [wakeUpStats, setWakeUpStats] = useState({
    averageWakeUpTime: '',
    totalWakeUpDays: 0,
    earliestWakeUp: '',
    latestWakeUp: ''
  });
  const [editWakeUpModal, setEditWakeUpModal] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [editWakeUpTime, setEditWakeUpTime] = useState<string>('');
  const [caloriesData, setCaloriesData] = useState({
    totalCalories: 0,
    averageCalories: 0,
    dailyCalories: [] as {date: string, calories: number}[]
  });
  const [form] = Form.useForm();
  const [showIndexHint, setShowIndexHint] = useState(false);
  const [indexUrl, setIndexUrl] = useState('');
  const [awakeTime, setAwakeTime] = useState<string>('');
  const [awakeTimeInterval, setAwakeTimeInterval] = useState<NodeJS.Timeout | null>(null);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [manualAwakeAdjustment, setManualAwakeAdjustment] = useState(0); // Minutes to add/subtract
  const [showAdjustAwakeModal, setShowAdjustAwakeModal] = useState(false);
  const [adjustAwakeForm] = Form.useForm();
  const [currentTime, setCurrentTime] = useState<string>(format(new Date(), 'hh:mm:ss a'));
  const [timeInterval, setTimeInterval] = useState<NodeJS.Timeout | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'minutes' | 'time'>('minutes');
  const [waterIntakeModal, setWaterIntakeModal] = useState(false);
  const [waterIntakeForm] = Form.useForm();
  const [waterAmount, setWaterAmount] = useState(250);
  const [waterData, setWaterData] = useState({
    totalWater: 0,
    averageWater: 0,
    dailyWater: [] as {date: string, amount: number}[],
    todayWater: 0
  });
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  // Add new state for Firebase operation loading
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);
  // Add overdueTasks to state
  const [overdueTasks, setOverdueTasks] = useState(0);

  // Add these constant values for the form watches
  const adjustmentTypeWatch = Form.useWatch('adjustmentType', adjustAwakeForm);
  const waterTypeWatch = Form.useWatch('waterType', waterIntakeForm);

  // Properly initialize forms after render (not during render)
  useEffect(() => {
    if (form) form.resetFields();
    if (adjustAwakeForm) adjustAwakeForm.resetFields();
    if (waterIntakeForm) waterIntakeForm.resetFields();
  }, [form, adjustAwakeForm, waterIntakeForm]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Move fetchAnalyticsData outside useEffect to make it accessible
  const fetchAnalyticsData = async () => {
    if (user) {
      setIsLoading(true);
      setIsFirebaseLoading(true);
      try {
        // Fetch tasks data for task overview section
        const todoTasks = await getTasksByStatus(user.uid, 'todo');
        const inProgressTasks = await getTasksByStatus(user.uid, 'in-progress');
        const completedTasks = await getTasksByStatus(user.uid, 'completed');

        // Set all tasks for the list view
        setAllTasks([...todoTasks, ...inProgressTasks, ...completedTasks]);

        // Calculate overdue tasks
        const now = new Date();
        const overdueTasksCount = [...todoTasks, ...inProgressTasks].filter(task => {
          const deadline = parseISO(task.deadline);
          return deadline < now;
        }).length;
        setOverdueTasks(overdueTasksCount);

        // Calculate priority stats
        const highPriorityTasks = [...todoTasks, ...inProgressTasks, ...completedTasks].filter(
          task => task.priority === 'high'
        );
        const mediumPriorityTasks = [...todoTasks, ...inProgressTasks, ...completedTasks].filter(
          task => task.priority === 'medium'
        );
        const lowPriorityTasks = [...todoTasks, ...inProgressTasks, ...completedTasks].filter(
          task => task.priority === 'low'
        );

        setTasksData({
          todoCount: todoTasks.length,
          inProgressCount: inProgressTasks.length,
          completedCount: completedTasks.length,
          overdue: overdueTasksCount,
          highPriority: highPriorityTasks.length,
          mediumPriority: mediumPriorityTasks.length,
          lowPriority: lowPriorityTasks.length
        });

        // Generate chart data for the selected timeframe
        generateChartData(parseInt(timeframe), todoTasks, inProgressTasks, completedTasks);
        
        // Also fetch daily logs for wake up time tracking
        await fetchDailyLogs();
        await fetchCaloriesData();
        await fetchWaterIntakeData();
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        notification.error({
          message: 'Error',
          description: 'Failed to fetch analytics data'
        });
      } finally {
        setIsLoading(false);
        setIsFirebaseLoading(false);
      }
    }
  };

  // Update useEffect to use the fetchAnalyticsData function
  useEffect(() => {
    fetchAnalyticsData();
  }, [user, timeframe]);

  // Update the useEffect for real-time awake duration
  useEffect(() => {
    // Find today's log
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayLogItem = dailyLogs.find(log => log.date === today);
    
    if (todayLogItem) {
      setTodayLog(todayLogItem);
      
      // Calculate and update awake duration every minute
      const calculateAwakeTime = () => {
        try {
          if (!todayLogItem.wakeUpTime) {
            setAwakeTime('Not logged yet');
            return;
          }
          
          // Use direct timestamp calculation to avoid library inconsistencies
          const wakeTime = new Date(todayLogItem.wakeUpTime).getTime();
          const nowTime = new Date().getTime();
          
          // Calculate difference in milliseconds, including the adjustment
          const adjustmentMs = manualAwakeAdjustment * 60 * 1000;
          const diffMs = nowTime - wakeTime + adjustmentMs;
          
          // Ensure we don't have negative time
          const safeDiffMs = Math.max(0, diffMs);
          
          // Convert to hours and minutes
          const diffMins = Math.floor(safeDiffMs / (1000 * 60));
          const hours = Math.floor(diffMins / 60);
          const minutes = diffMins % 60;
          
          const timeString = `${hours}h ${minutes}m`;
          setAwakeTime(timeString);
          
          console.log(`Updated awake time: ${timeString} (${diffMins} minutes) - Adjustment: ${manualAwakeAdjustment}m`);
        } catch (error) {
          console.error('Error calculating awake time:', error, todayLogItem);
          setAwakeTime('Error calculating time');
        }
      };
      
      // Calculate immediately when component mounts
      calculateAwakeTime();
      
      // Clear previous interval if exists
      if (awakeTimeInterval) {
        clearInterval(awakeTimeInterval);
      }
      
      // Update every second for maximum responsiveness
      const interval = setInterval(calculateAwakeTime, 1000);
      setAwakeTimeInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      setAwakeTime('Not logged yet');
      console.log('No wake-up time found for today');
    }
  }, [dailyLogs, manualAwakeAdjustment]);

  // Add a dedicated function to force refresh the awake time
  const forceRefreshAwakeTime = () => {
    fetchDailyLogs();
  };

  // Force refresh of data after certain time period
  useEffect(() => {
    // Set up an interval to refresh data every minute to ensure it stays in sync
    const refreshInterval = setInterval(() => {
      console.log("Forcing data refresh");
      fetchDailyLogs();
      fetchWaterIntakeData();
      fetchCaloriesData();
    }, 60000); // Refresh every minute
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (awakeTimeInterval) {
        clearInterval(awakeTimeInterval);
      }
    };
  }, [awakeTimeInterval]);

  // Add a useEffect to update the current time every second
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(format(new Date(), 'hh:mm:ss a'));
    };
    
    // Update immediately when component mounts
    updateTime();
    
    // Then set interval for updates
    const interval = setInterval(updateTime, 1000);
    
    setTimeInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Add localStorage load on component mount
  useEffect(() => {
    // Load saved adjustment from localStorage
    try {
      const savedAdjustment = localStorage.getItem('awakeTimeAdjustment');
      if (savedAdjustment !== null) {
        setManualAwakeAdjustment(parseInt(savedAdjustment));
        console.log(`Loaded saved adjustment: ${savedAdjustment} minutes`);
      }

      const savedAdjustmentType = localStorage.getItem('adjustmentType');
      if (savedAdjustmentType) {
        setAdjustmentType(savedAdjustmentType as 'minutes' | 'time');
      }
    } catch (error) {
      console.error('Error loading saved adjustment:', error);
    }
  }, []);

  const generateChartData = (days: number, todoTasks: any[], inProgressTasks: any[], completedTasks: any[]) => {
    const today = startOfDay(new Date());
    const dates = Array.from({ length: days }, (_, i) => format(addDays(today, -days + i + 1), 'yyyy-MM-dd'));
    
    // Data for completed tasks per day chart
    const completedByDay = dates.map(date => {
      return completedTasks.filter(task => {
        return task.completedAt && task.completedAt.startsWith(date);
      }).length;
    });

    // Data for created tasks per day chart
    const createdByDay = dates.map(date => {
      return [...todoTasks, ...inProgressTasks, ...completedTasks].filter(task => {
        return task.createdAt && task.createdAt.startsWith(date);
      }).length;
    });

    // Format dates for display
    const formattedDates = dates.map(date => format(parseISO(date), 'MMM dd'));

    const generatedData = {
      taskStatusCount: {
        labels: ['To Do', 'In Progress', 'Completed'],
        datasets: [
          {
            data: [todoTasks.length, inProgressTasks.length, completedTasks.length],
            backgroundColor: [chartColors.danger, chartColors.warning, chartColors.success],
            borderWidth: 1
          }
        ]
      },
      taskCompletionTrend: {
        labels: formattedDates,
        datasets: [
          {
            label: 'Tasks Completed',
            data: completedByDay,
            borderColor: chartColors.success,
            backgroundColor: `${chartColors.success}50`,
            fill: true,
            tension: 0.4
          }
        ]
      },
      taskCreationTrend: {
        labels: formattedDates,
        datasets: [
          {
            label: 'Tasks Created',
            data: createdByDay,
            borderColor: chartColors.primary,
            backgroundColor: `${chartColors.primary}50`,
            fill: true,
            tension: 0.4
          }
        ]
      },
      taskPriorityDistribution: {
        labels: ['High', 'Medium', 'Low'],
        datasets: [
          {
            data: [
              tasksData.highPriority,
              tasksData.mediumPriority,
              tasksData.lowPriority
            ],
            backgroundColor: [chartColors.danger, chartColors.warning, chartColors.success],
            borderWidth: 1
          }
        ]
      }
    };

    setChartData(generatedData);
  };

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const fetchDailyLogs = async () => {
    if (!user) return;
    
    try {
      const days = parseInt(timeframe);
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const logsRef = collection(db, 'dailyLogs');
      const q = query(
        logsRef,
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const logs = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() })) as DailyLog[];
      
      // Client-side filtering
      const filteredLogs = logs.filter(log => log.date >= startDate)
        .sort((a, b) => b.date.localeCompare(a.date));
      
      // Check if today's log exists
      const todayLog = logs.find(log => log.date === today);
      
      // If no log exists for today, create one with current time as wake up time
      if (!todayLog) {
        console.log('No log for today, creating one...');
        const newLogData = {
          date: today,
          userId: user.uid,
          wakeUpTime: new Date().toISOString(), // Use current time as wake up time
          createdAt: new Date().toISOString(),
          totalWorkTime: 0,
          totalBreakTime: 0,
          records: [],
          notes: ''
        };
        
        // Add new log to Firestore
        try {
          const docRef = await addDoc(collection(db, 'dailyLogs'), newLogData);
          console.log('Created new daily log with ID:', docRef.id);
          
          // Add the new log to our filtered logs
          filteredLogs.unshift({ 
            id: docRef.id, 
            ...newLogData 
          } as DailyLog);
        } catch (error) {
          console.error('Error creating daily log:', error);
        }
      }
      
      setDailyLogs(filteredLogs);
      
      // Calculate wake up statistics
      calculateWakeUpStats(filteredLogs);
    } catch (error) {
      console.error('Error fetching daily logs:', error);
      
      // Check if this is a missing index error and extract the URL
      if (error.toString().includes('index')) {
        const urlMatch = error.toString().match(/https:\/\/console\.firebase\.google\.com[^"'\s]+/);
        if (urlMatch) {
          setIndexUrl(urlMatch[0]);
          setShowIndexHint(true);
        }
      }
    }
  };

  const fetchCaloriesData = async () => {
    if (!user) return;
    
    try {
      const days = parseInt(timeframe);
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      
      const mealsRef = collection(db, 'meals');
      const q = query(
        mealsRef,
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const meals = querySnapshot.docs
        .map(doc => doc.data())
        .filter(meal => meal.date && meal.date >= startDate);
      
      // Group calories by date
      const caloriesByDate: Record<string, number> = {};
      
      meals.forEach(meal => {
        if (meal.date && meal.calories) {
          if (!caloriesByDate[meal.date]) {
            caloriesByDate[meal.date] = 0;
          }
          caloriesByDate[meal.date] += Number(meal.calories) || 0;
        }
      });
      
      // Calculate total and average
      const dates = Object.keys(caloriesByDate);
      const totalCalories = Object.values(caloriesByDate).reduce((sum, val) => sum + val, 0);
      const averageCalories = dates.length > 0 ? Math.round(totalCalories / dates.length) : 0;
      
      // Format for chart display
      const dailyCalories = dates.map(date => ({
        date,
        calories: caloriesByDate[date]
      })).sort((a, b) => a.date.localeCompare(b.date));
      
      setCaloriesData({
        totalCalories,
        averageCalories,
        dailyCalories
      });
      
      // Add calories chart data
      if (chartData) {
        const caloriesChartData = {
          labels: dailyCalories.map(item => format(parseISO(item.date), 'MMM dd')),
          datasets: [
            {
              label: 'Calories Consumed',
              data: dailyCalories.map(item => item.calories),
              borderColor: chartColors.purple,
              backgroundColor: `${chartColors.purple}50`,
              fill: true,
              tension: 0.4
            }
          ]
        };
        
        setChartData({
          ...chartData,
          caloriesChart: caloriesChartData
        });
      }
      
    } catch (error) {
      console.error('Error fetching calories data:', error);
    }
  };

  const fetchWaterIntakeData = async () => {
    if (!user) return;
    
    try {
      const days = parseInt(timeframe);
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Get all water intake tasks
      const tasksRef = collection(db, 'tasks');
      const q = query(
        tasksRef,
        where('userId', '==', user.uid),
        where('type', '==', 'water')
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.size} water tasks`); // Debug log
      
      // Define a type for water task with required fields
      type WaterTask = {
        id: string;
        deadline?: string;
        title?: string;
        waterAmount?: number;
        [key: string]: any;
      };
      
      const waterTasks = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }) as WaterTask)
        .filter(task => {
          const taskDate = task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : '';
          return taskDate >= startDate;
        });
      
      console.log('Filtered water tasks:', waterTasks); // Debug log
      
      // Group water intake by date
      const waterByDate: Record<string, number> = {};
      let todayTotal = 0;
      
      waterTasks.forEach(task => {
        const taskDate = task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : '';
        
        if (taskDate) {
          if (!waterByDate[taskDate]) {
            waterByDate[taskDate] = 0;
          }
          
          // Get the water amount, either from waterAmount field or extract from title
          let amount = task.waterAmount || 0;
          if (!amount && task.title) {
            const matches = task.title.match(/Drink Water \((\d+)ml\)/);
            if (matches && matches[1]) {
              amount = parseInt(matches[1]);
            }
          }
          
          waterByDate[taskDate] += amount;
          
          // Track today's total
          if (taskDate === today) {
            todayTotal += amount;
          }
        }
      });
      
      // Calculate total and average
      const dates = Object.keys(waterByDate);
      const totalWater = Object.values(waterByDate).reduce((sum, val) => sum + val, 0);
      const averageWater = dates.length > 0 ? Math.round(totalWater / dates.length) : 0;
      
      // Format for chart display
      const dailyWater = dates.map(date => ({
        date,
        amount: waterByDate[date]
      })).sort((a, b) => a.date.localeCompare(b.date));
      
      console.log('Water data processed:', { totalWater, averageWater, dailyWater, todayWater: todayTotal }); // Debug log
      
      setWaterData({
        totalWater,
        averageWater,
        dailyWater,
        todayWater: todayTotal
      });
      
      // Add water chart data
      if (chartData) {
        const waterChartData = {
          labels: dailyWater.map(item => format(parseISO(item.date), 'MMM dd')),
          datasets: [
            {
              label: 'Water Intake (ml)',
              data: dailyWater.map(item => item.amount),
              borderColor: chartColors.info,
              backgroundColor: `${chartColors.info}50`,
              fill: true,
              tension: 0.4
            }
          ]
        };
        
        setChartData({
          ...chartData,
          waterChart: waterChartData
        });
      }
      
    } catch (error) {
      console.error('Error fetching water intake data:', error);
    }
  };

  const calculateWakeUpStats = (logs: DailyLog[]) => {
    // Filter logs that have wake up time
    const logsWithWakeUp = logs.filter(log => log.wakeUpTime);
    
    if (logsWithWakeUp.length === 0) {
      setWakeUpStats({
        averageWakeUpTime: 'N/A',
        totalWakeUpDays: 0,
        earliestWakeUp: 'N/A',
        latestWakeUp: 'N/A'
      });
      return;
    }
    
    // Get all wake up times as Date objects
    const wakeUpTimes = logsWithWakeUp.map(log => new Date(log.wakeUpTime || ''));
    
    // Calculate average wake up time
    let totalMinutes = 0;
    wakeUpTimes.forEach(time => {
      totalMinutes += time.getHours() * 60 + time.getMinutes();
    });
    
    const avgMinutes = Math.round(totalMinutes / wakeUpTimes.length);
    const avgHours = Math.floor(avgMinutes / 60);
    const avgMins = avgMinutes % 60;
    const averageWakeUpTime = `${avgHours.toString().padStart(2, '0')}:${avgMins.toString().padStart(2, '0')}`;
    
    // Find earliest and latest wake up times (comparing only hours and minutes)
    let earliest = wakeUpTimes[0];
    let latest = wakeUpTimes[0];
    
    wakeUpTimes.forEach(time => {
      const timeValue = time.getHours() * 60 + time.getMinutes();
      const earliestValue = earliest.getHours() * 60 + earliest.getMinutes();
      const latestValue = latest.getHours() * 60 + latest.getMinutes();
      
      if (timeValue < earliestValue) earliest = time;
      if (timeValue > latestValue) latest = time;
    });
    
    setWakeUpStats({
      averageWakeUpTime,
      totalWakeUpDays: logsWithWakeUp.length,
      earliestWakeUp: `${earliest.getHours().toString().padStart(2, '0')}:${earliest.getMinutes().toString().padStart(2, '0')}`,
      latestWakeUp: `${latest.getHours().toString().padStart(2, '0')}:${latest.getMinutes().toString().padStart(2, '0')}`
    });
  };

  // Add a helper function to convert hours and minutes to angle for clock hands
  const timeToAngle = (hours: number, minutes: number) => {
    // Hour hand makes a full circle in 12 hours (30 degrees per hour)
    // Minute hand makes a full circle in 60 minutes (6 degrees per minute)
    const hourAngle = (hours % 12) * 30 + minutes * 0.5; // 30 degrees per hour + adjustment for minutes
    const minuteAngle = minutes * 6; // 6 degrees per minute
    
    return { hourAngle, minuteAngle };
  };

  const handleEditWakeUpTime = (logId: string, currentWakeUpTime: string) => {
    setSelectedLogId(logId);
    
    // Use dayjs to handle the time
    const wakeTime = dayjs(currentWakeUpTime);
    setEditWakeUpTime(wakeTime.format('HH:mm'));
    setEditWakeUpModal(true);
    
    // Set the wake up time in the form for the TimePicker inside the clock
    form.setFieldsValue({ wakeUpTime: wakeTime });
  };

  const handleSaveWakeUpTime = async () => {
    try {
      const values = await form.validateFields();
      
      if (!selectedLogId) return;
      
      const logRef = doc(db, 'dailyLogs', selectedLogId);
      
      // Extract the time from the dayjs object and ensure it's valid
      const wakeDayjs = values.wakeUpTime;
      if (!wakeDayjs) {
        notification.error({
          message: 'Error',
          description: 'Please select a valid time'
        });
        return;
      }
      
      const newWakeUpTime = wakeDayjs.toDate().toISOString();
      console.log('Saving new wake up time:', newWakeUpTime);
      
      await updateDoc(logRef, { wakeUpTime: newWakeUpTime });
      
      // Update local state
      const updatedLogs = dailyLogs.map(log => 
        log.id === selectedLogId 
          ? { ...log, wakeUpTime: newWakeUpTime } 
          : log
      );
      setDailyLogs(updatedLogs);
      
      // Recalculate stats with updated logs
      calculateWakeUpStats(updatedLogs);
      
      notification.success({
        message: 'Success',
        description: 'Wake up time updated successfully'
      });
      setEditWakeUpModal(false);
      
      // Force re-fetch to ensure data is updated
      fetchDailyLogs();
    } catch (error) {
      console.error('Error updating wake up time:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to update wake up time'
      });
    }
  };

  const handleAdjustAwakeTime = () => {
    // Reset the form first to clear any previous values
    adjustAwakeForm.resetFields();
    
    // Set form values after reset
    setTimeout(() => {
      adjustAwakeForm.setFieldsValue({
        adjustmentType: adjustmentType,
        adjustmentMinutes: manualAwakeAdjustment,
        fixedWakeTime: todayLog && todayLog.wakeUpTime ? dayjs(todayLog.wakeUpTime) : undefined
      });
      
      console.log('Form initialized with:', {
        adjustmentType,
        adjustmentMinutes: manualAwakeAdjustment,
        wakeUpTime: todayLog?.wakeUpTime
      });
    }, 100);
    
    // Show the modal
    setShowAdjustAwakeModal(true);
  };

  const handleSaveAwakeAdjustment = async () => {
    try {
      // First, determine which fields to validate based on the current adjustment type
      let fieldsToValidate = [];
      
      // Get the current adjustment type directly from state rather than form to avoid race conditions
      if (adjustmentType === 'minutes') {
        fieldsToValidate = ['adjustmentMinutes'];
      } else {
        fieldsToValidate = ['fixedWakeTime'];
      }
      
      // Log current form values for debugging
      console.log('Current form values:', adjustAwakeForm.getFieldsValue());
      console.log('Validating fields:', fieldsToValidate);
      
      // Validate only the fields that are relevant to the current adjustment type
      const values = await adjustAwakeForm.validateFields(fieldsToValidate);
      console.log('Validated values:', values);
      
      if (adjustmentType === 'minutes') {
        // Set manual minutes adjustment
        // Make sure to handle any potential non-numeric inputs safely
        const minutesValue = values.adjustmentMinutes;
        const minutes = typeof minutesValue === 'number' ? minutesValue : parseInt(minutesValue || '0');
        
        if (isNaN(minutes)) {
          throw new Error('Invalid adjustment minutes');
        }
        
        console.log('Setting adjustment minutes:', minutes);
        setManualAwakeAdjustment(minutes);
        
        // Save to localStorage for persistence
        localStorage.setItem('awakeTimeAdjustment', minutes.toString());
        localStorage.setItem('adjustmentType', 'minutes');
        
        notification.success({
          message: 'Success',
          description: `Awake time ${minutes >= 0 ? 'increased' : 'decreased'} by ${Math.abs(minutes)} minutes`
        });
      } else {
        // Calculate difference between original wake time and new fixed time
        if (todayLog && todayLog.wakeUpTime) {
          const originalWakeTime = new Date(todayLog.wakeUpTime);
          const newWakeTimeObj = values.fixedWakeTime; // This is a dayjs object
          
          if (!newWakeTimeObj || !newWakeTimeObj.isValid()) {
            notification.error({
              message: 'Error',
              description: 'Please select a valid time'
            });
            return;
          }
          
          console.log('Fixed wake time:', newWakeTimeObj.format('HH:mm'));
          
          // Create a new date using today's date and the selected time
          const today = new Date();
          const newWakeTime = new Date(
            today.getFullYear(), 
            today.getMonth(), 
            today.getDate(), 
            newWakeTimeObj.hour(), 
            newWakeTimeObj.minute()
          );
          
          // If the new time is after now, assume it's for yesterday 
          // (user woke up after midnight)
          if (newWakeTime > today) {
            newWakeTime.setDate(newWakeTime.getDate() - 1);
          }

          // Calculate difference in minutes (negative if original is earlier)
          const diffMinutes = Math.round((originalWakeTime.getTime() - newWakeTime.getTime()) / (60 * 1000));
          
          console.log('Time adjustment:', {
            original: originalWakeTime.toISOString(),
            new: newWakeTime.toISOString(),
            diffMinutes
          });
          
          setManualAwakeAdjustment(diffMinutes);
          setAdjustmentType('time');
          
          // Save to localStorage for persistence
          localStorage.setItem('awakeTimeAdjustment', diffMinutes.toString());
          localStorage.setItem('adjustmentType', 'time');
          
          notification.success({
            message: 'Success',
            description: `Wake-up time adjusted (${diffMinutes >= 0 ? '+' : ''}${diffMinutes} minutes)`
          });
        } else {
          notification.error({
            message: 'Error',
            description: 'No wake-up time recorded for today'
          });
        }
      }
      
      // Force refresh the awake time calculation
      forceRefreshAwakeTime();
      
      setShowAdjustAwakeModal(false);
    } catch (error) {
      console.error('Error saving awake time adjustment:', error);
      
      // More detailed error logging
      if (error.errorFields) {
        console.error('Form validation errors:', error.errorFields);
      }
      
      // More specific error message
      if (error.errorFields && error.errorFields.length > 0) {
        const fieldErrors = error.errorFields.map(field => `${field.name.join('.')}: ${field.errors.join(', ')}`).join('; ');
        notification.error({
          message: 'Form Validation Error',
          description: `Please fix the following errors: ${fieldErrors}`
        });
      } else {
        notification.error({
          message: 'Error',
          description: error.message || 'Failed to save adjustment'
        });
      }
    }
  };

  const handleWaterIntake = () => {
    setWaterIntakeModal(true);
    waterIntakeForm.setFieldsValue({
      waterType: 'glass',
      quantity: 1
    });
  };

  const handleWaterIntakeSubmit = async () => {
    try {
      const values = await waterIntakeForm.validateFields();
      let amount = 0;
      
      // Calculate water amount based on type and quantity
      if (values.waterType === 'glass') {
        amount = values.quantity * 250; // 250ml per glass
      } else if (values.waterType === 'bottle') {
        amount = values.quantity * 500; // 500ml per bottle
      } else if (values.waterType === 'custom') {
        amount = values.customAmount;
      }
      
      const waterTaskData = {
        title: `Drink Water (${amount}ml)`,
        description: `${values.quantity} ${values.waterType === 'custom' ? 'custom amount' : 
          values.waterType + (values.quantity > 1 ? 's' : '')} of water`,
        status: 'completed' as TaskStatus, // Mark as completed since it's an immediate water intake
        priority: 'medium' as TaskPriority,
        deadline: new Date().toISOString(),
        userId: user.uid,
        isRecurring: false,
        completedAt: new Date().toISOString(), // Set completion time
        type: 'water',
        createdAt: new Date().toISOString(),
        waterAmount: amount // Explicitly set water amount
      };
      
      console.log("Adding water intake task:", waterTaskData);
      
      // Directly add to Firestore
      const tasksRef = collection(db, 'tasks');
      await addDoc(tasksRef, waterTaskData);
      
      // Update the water data immediately
      setWaterIntakeModal(false);
      notification.success({
        message: 'Success',
        description: `${amount}ml water intake added`
      });
      
      // Refresh the water data
      await fetchWaterIntakeData();
      
    } catch (error) {
      console.error('Error in water intake form:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to add water intake'
      });
    }
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Calculate completion rate
  const totalTasks = tasksData.todoCount + tasksData.inProgressCount + tasksData.completedCount;
  const completionRate = totalTasks > 0 ? Math.round((tasksData.completedCount / totalTasks) * 100) : 0;

  // Add the styles to a global style block at the top of the component
  const globalStyles = `
    @media (max-width: 768px) {
      .awake-time-container {
        margin-top: 16px;
      }
    }
    @keyframes pulse {
      0% {
        opacity: 1;
      }
      50% {
        opacity: 0.8;
      }
      100% {
        opacity: 1;
      }
    }
  `;

  return (
    <>
      <style>{globalStyles}</style>
      
      {/* Wake Up Time Adjustment Modal */}
      <Modal
        title="Adjust Wake-up Time"
        open={showAdjustAwakeModal}
        onCancel={() => setShowAdjustAwakeModal(false)}
        destroyOnClose={true}
        footer={[
          <Button key="cancel" onClick={() => setShowAdjustAwakeModal(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSaveAwakeAdjustment}>
            Save
          </Button>
        ]}
      >
        <Form 
          form={adjustAwakeForm} 
          layout="vertical"
          preserve={false}
          onValuesChange={(changedValues) => {
            // If adjustment type changed, update the state
            if ('adjustmentType' in changedValues) {
              setAdjustmentType(changedValues.adjustmentType);
            }

            console.log('Form values changed:', changedValues);
          }}
        >
          <Form.Item
            name="adjustmentType"
            label="Adjustment Type"
            initialValue={adjustmentType}
          >
            <Radio.Group 
              onChange={(e) => setAdjustmentType(e.target.value)}
            >
              <Radio value="minutes">Adjust by Minutes</Radio>
              <Radio value="time">Set Exact Wake Time</Radio>
            </Radio.Group>
          </Form.Item>

          {adjustmentType === 'minutes' && (
            <Form.Item
              name="adjustmentMinutes"
              label="Adjust Time (in minutes)"
              rules={[{ required: true, message: 'Please enter an adjustment value' }]}
              initialValue={manualAwakeAdjustment}
            >
              <InputNumber 
                placeholder="Enter minutes (can be negative)" 
                style={{ width: '100%' }}
                min={-120}
                max={120}
              />
            </Form.Item>
          )}

          {adjustmentType === 'time' && (
            <Form.Item
              name="fixedWakeTime"
              label="Exact Wake-up Time"
              rules={[{ required: true, message: 'Please select a time' }]}
              initialValue={todayLog && todayLog.wakeUpTime ? dayjs(todayLog.wakeUpTime) : undefined}
            >
              <TimePicker 
                format="HH:mm" 
                style={{ width: '100%' }} 
                placeholder="Select time"
                showNow={false}
                minuteStep={5}
                allowClear={false}
              />
            </Form.Item>
          )}

          {todayLog && todayLog.wakeUpTime && (
            <Alert
              message="Current Wake-up Time"
              description={`${format(new Date(todayLog.wakeUpTime), 'hh:mm a')} (Adjustment: ${manualAwakeAdjustment} minutes)`}
              type="info"
              showIcon
              style={{ marginTop: '16px' }}
            />
          )}
        </Form>
      </Modal>

      {/* Water Intake Modal */}
      <Modal
        title="Add Water Intake"
        open={waterIntakeModal}
        onCancel={() => setWaterIntakeModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setWaterIntakeModal(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleWaterIntakeSubmit}>
            Add
          </Button>
        ]}
      >
        <Form form={waterIntakeForm} layout="vertical">
          <Form.Item
            name="waterType"
            label="Water Type"
            initialValue="glass"
          >
            <Radio.Group>
              <Radio value="glass">Glass (250ml)</Radio>
              <Radio value="bottle">Bottle (500ml)</Radio>
              <Radio value="custom">Custom Amount</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            initialValue={1}
            style={{ display: waterTypeWatch !== 'custom' ? 'block' : 'none' }}
          >
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="customAmount"
            label="Custom Amount (ml)"
            initialValue={250}
            style={{ display: waterTypeWatch === 'custom' ? 'block' : 'none' }}
          >
            <InputNumber min={50} max={2000} step={50} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
      
      <Form.Provider>
        <Layout style={{ minHeight: '100vh', background: '#141414' }} data-theme={isDarkMode ? 'dark' : 'light'}>
          <Sider 
            collapsible 
            collapsed={collapsed} 
            onCollapse={value => setCollapsed(value)}
            theme={isDarkMode ? 'dark' : 'light'}
            style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.05)' }}
          >
            <div className="logo">
              {!collapsed && 'Task Tracker'}
            </div>
            <Menu 
              theme={isDarkMode ? 'dark' : 'light'} 
              mode="inline" 
              defaultSelectedKeys={['2']}
              items={[
                {
                  key: '1',
                  icon: <DashboardOutlined />,
                  label: 'Dashboard',
                  onClick: () => router.push('/dashboard')
                },
                {
                  key: '2',
                  icon: <BarChartOutlined />,
                  label: 'Analytics',
                  onClick: () => router.push('/analytics')
                },
                {
                  key: '3',
                  icon: <SettingOutlined />,
                  label: 'Recurring Tasks',
                  onClick: () => router.push('/admin')
                },
                {
                  key: '5',
                  icon: <CalendarOutlined />,
                  label: 'Lifestyle',
                  onClick: () => router.push('/lifestyle')
                },
                {
                  key: '4',
                  icon: <LogoutOutlined />,
                  label: 'Logout',
                  onClick: handleLogout
                }
              ]}
            />
          </Sider>
          <Content style={{ padding: '24px' }}>
            <Row gutter={[24, 24]}>
              {/* Wake up time card */}
              <Col xs={24}>
                <Card 
                  style={{ 
                    ...cardStyle, 
                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    border: 'none'
                  }}
                  styles={{
                    body: { 
                      padding: '24px' 
                    }
                  }}
                >
                  <div className="awake-time-container">
                    <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                      <ClockCircleOutlined style={{ marginRight: '8px' }} />
                      <span>You woke up today at</span>
                      <Button 
                        type="text" 
                        size="small"
                        icon={<SettingOutlined />}
                        onClick={handleAdjustAwakeTime}
                        style={{ marginLeft: '8px', color: 'rgba(255, 255, 255, 0.85)' }}
                      />
                    </div>
                    <div style={{ 
                      fontSize: '48px', 
                      fontWeight: 'bold',
                      lineHeight: 1.2,
                      marginBottom: '16px'
                    }}>
                      {todayLog && format(parseISO(todayLog.wakeUpTime || ''), 'hh:mm a')}
                    </div>
                    <div style={{ 
                      fontSize: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{ marginRight: '12px' }}>Time awake</span>
                      <span style={{ fontWeight: 'bold' }}>{awakeTime}</span>
                      {manualAwakeAdjustment !== 0 && (
                        <Tag color="blue" style={{ 
                          marginLeft: '12px', 
                          fontSize: '14px',
                          padding: '4px 12px',
                          borderRadius: '12px'
                        }}>
                          {manualAwakeAdjustment > 0 ? `+${manualAwakeAdjustment}m` : `${manualAwakeAdjustment}m`}
                        </Tag>
                      )}
                    </div>
                    {manualAwakeAdjustment !== 0 && (
                      <div style={{ fontSize: '14px', opacity: 0.85 }}>
                        Wake time adjusted by {manualAwakeAdjustment} minutes
                      </div>
                    )}
                  </div>
                </Card>
              </Col>

              {/* Metric cards */}
              <Col xs={24} sm={8}>
                <Card style={metricCardStyle}>
                  <Statistic
                    title={<div style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Total Tasks</div>}
                    value={totalTasks}
                    prefix={<FileOutlined />}
                    valueStyle={{ color: '#fff', fontSize: '32px' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card style={metricCardStyle}>
                  <Statistic
                    title={<div style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Completion Rate</div>}
                    value={completionRate}
                    suffix="%"
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#fff', fontSize: '32px' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card style={metricCardStyle}>
                  <Statistic
                    title={<div style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Overdue Tasks</div>}
                    value={overdueTasks}
                    prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                    valueStyle={{ color: '#ff4d4f', fontSize: '32px' }}
                  />
                </Card>
              </Col>

              {/* Task List */}
              <Col xs={24}>
                <Card 
                  title={<Typography.Title level={5} style={{ margin: 0, color: '#fff' }}>Task List</Typography.Title>}
                  style={cardStyle}
                  styles={{
                    body: { padding: '24px' }
                  }}
                >
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '48px' }}>
                      <Spin size="large" />
                    </div>
                  ) : allTasks.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={<span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>No tasks found</span>}
                    />
                  ) : (
                    <TaskListView
                      tasks={allTasks}
                      onTaskUpdated={fetchAnalyticsData}
                      onTaskDeleted={async (taskId) => {
                        await deleteTask(taskId);
                        await fetchAnalyticsData();
                        notification.success({
                          message: 'Success',
                          description: 'Task deleted successfully'
                        });
                      }}
                      onTaskStatusChange={async (taskId, newStatus) => {
                        await updateTask(taskId, { status: newStatus });
                        await fetchAnalyticsData();
                        notification.success({
                          message: 'Success',
                          description: 'Task status updated successfully'
                        });
                      }}
                    />
                  )}
                </Card>
              </Col>

              {/* Productivity Insight */}
              <Col xs={24}>
                <Alert
                  message="Productivity Insight"
                  description={`Based on your task data, there's room for improvement. You have completed ${tasksData.completedCount} tasks out of ${totalTasks} total tasks, with a completion rate of ${completionRate}%.`}
                  type="error"
                  showIcon
                  style={{ 
                    background: '#2a1215', 
                    border: '1px solid #5c1d24',
                    borderRadius: '12px'
                  }}
                />
              </Col>

              {/* Wake Up Analytics */}
              <Col xs={24}>
                <Card 
                  title={<Typography.Title level={5} style={{ margin: 0, color: '#fff' }}>Wake Up Time Analytics</Typography.Title>}
                  style={cardStyle}
                  styles={{
                    body: { padding: '24px' }
                  }}
                >
                  <Row gutter={[24, 24]}>
                    <Col xs={24} sm={6}>
                      <Statistic
                        title={<div style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Average Wake Up Time</div>}
                        value={wakeUpStats.averageWakeUpTime}
                        prefix={<ClockCircleOutlined />}
                        valueStyle={{ color: '#fff', fontSize: '24px' }}
                      />
                    </Col>
                    <Col xs={24} sm={6}>
                      <Statistic
                        title={<div style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Days Tracked</div>}
                        value={wakeUpStats.totalWakeUpDays}
                        prefix={<CalendarOutlined />}
                        valueStyle={{ color: '#fff', fontSize: '24px' }}
                      />
                    </Col>
                    <Col xs={24} sm={6}>
                      <Statistic
                        title={<div style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Earliest Wake Up</div>}
                        value={wakeUpStats.earliestWakeUp}
                        prefix={<RiseOutlined />}
                        valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                      />
                    </Col>
                    <Col xs={24} sm={6}>
                      <Statistic
                        title={<div style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Latest Wake Up</div>}
                        value={wakeUpStats.latestWakeUp}
                        prefix={<FallOutlined />}
                        valueStyle={{ color: '#ff4d4f', fontSize: '24px' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </Content>
        </Layout>
      </Form.Provider>
    </>
  );
};

export default AnalyticsPage;

// Custom Menu component to fix TypeScript issues
const Menu = ({ items, defaultSelectedKeys, mode, theme }: any) => {
  return (
    <div className={`ant-menu ant-menu-root ant-menu-${mode} ant-menu-${theme}`}>
      {items.map((item: any) => (
        <div
          key={item.key}
          className={`ant-menu-item ${defaultSelectedKeys.includes(item.key) ? 'ant-menu-item-selected' : ''}`}
          onClick={item.onClick}
          style={{ padding: '0 24px', height: '40px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          {item.icon}
          <span style={{ marginLeft: '10px' }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}; 