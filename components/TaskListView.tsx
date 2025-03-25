import React, { useState, useContext } from 'react';
import { 
  Table, 
  Tag, 
  Space, 
  Button, 
  Input, 
  Select, 
  DatePicker, 
  Typography,
  Tooltip,
  Badge,
  Dropdown,
  Menu,
  Modal,
  Form,
  message
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  SortAscendingOutlined,
  GroupOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  CoffeeOutlined,
  DropboxOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { Task, TaskStatus, TaskPriority } from '@/lib/types';
import { ThemeContext } from '@/app/providers';
import { format, parseISO, isPast } from 'date-fns';
import dayjs from 'dayjs';
import { ColumnsType } from 'antd/es/table';

const { Text, Title } = Typography;
const { Option } = Select;

interface TaskListViewProps {
  tasks: Task[];
  onTaskUpdated: () => void;
  onTaskDeleted: (taskId: string) => void;
  onTaskStatusChange: (taskId: string, status: TaskStatus) => void;
}

const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onTaskUpdated,
  onTaskDeleted,
  onTaskStatusChange
}) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('deadline');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('ascend');
  const [groupBy, setGroupBy] = useState<string>('none');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [form] = Form.useForm();

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || task.type === typeFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aValue = a[sortField as keyof Task];
    const bValue = b[sortField as keyof Task];
    
    if (sortField === 'deadline') {
      return sortOrder === 'ascend' 
        ? new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        : new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
    }
    
    if (typeof aValue === 'string') {
      return sortOrder === 'ascend'
        ? aValue.localeCompare(bValue as string)
        : (bValue as string).localeCompare(aValue);
    }
    
    return 0;
  });

  // Group tasks if grouping is enabled
  const groupedTasks = groupBy === 'none' ? sortedTasks : sortedTasks.reduce((acc, task) => {
    const groupKey = task[groupBy as keyof Task];
    if (!acc[groupKey as string]) {
      acc[groupKey as string] = [];
    }
    acc[groupKey as string].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'processing';
      case 'todo': return 'default';
      default: return 'default';
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'meal': return <CoffeeOutlined />;
      case 'water': return <DropboxOutlined />;
      case 'sleep': return <ClockCircleOutlined />;
      case 'schedule': return <CalendarOutlined />;
      default: return null;
    }
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    form.setFieldsValue({
      title: task.title,
      description: task.description,
      priority: task.priority,
      deadline: dayjs(task.deadline)
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();
      if (selectedTask) {
        // Update task logic here
        onTaskUpdated();
        setEditModalVisible(false);
        message.success('Task updated successfully');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      message.error('Failed to update task');
    }
  };

  const columns: ColumnsType<Task> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Task) => (
        <Space>
          {getTypeIcon(record.type)}
          <Text>{text}</Text>
          {record.isRecurring && (
            <Tooltip title="Recurring Task">
              <SyncOutlined style={{ color: '#1890ff' }} />
            </Tooltip>
          )}
        </Space>
      ),
      sorter: (a: Task, b: Task) => a.title.localeCompare(b.title)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'To Do', value: 'todo' },
        { text: 'In Progress', value: 'in-progress' },
        { text: 'Completed', value: 'completed' }
      ],
      onFilter: (value: string, record: Task) => record.status === value
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: TaskPriority) => (
        <Tag color={getPriorityColor(priority)}>
          {priority.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'High', value: 'high' },
        { text: 'Medium', value: 'medium' },
        { text: 'Low', value: 'low' }
      ],
      onFilter: (value: string, record: Task) => record.priority === value
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (deadline: string) => {
        const isOverdue = isPast(parseISO(deadline));
        return (
          <Space>
            <CalendarOutlined />
            <Text type={isOverdue ? 'danger' : undefined}>
              {format(parseISO(deadline), 'MMM dd, yyyy HH:mm')}
            </Text>
          </Space>
        );
      },
      sorter: (a: Task, b: Task) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Task) => (
        <Space>
          <Tooltip title="View Details">
            <Button type="text" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="Edit Task">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Delete Task">
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onTaskDeleted(record.id)} />
          </Tooltip>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item 
                  key="todo" 
                  onClick={() => onTaskStatusChange(record.id, 'todo')}
                  disabled={record.status === 'todo'}
                >
                  Move to To Do
                </Menu.Item>
                <Menu.Item 
                  key="in-progress" 
                  onClick={() => onTaskStatusChange(record.id, 'in-progress')}
                  disabled={record.status === 'in-progress'}
                >
                  Move to In Progress
                </Menu.Item>
                <Menu.Item 
                  key="completed" 
                  onClick={() => onTaskStatusChange(record.id, 'completed')}
                  disabled={record.status === 'completed'}
                >
                  Mark as Completed
                </Menu.Item>
              </Menu>
            }
          >
            <Button type="text" icon={<CheckCircleOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Input
            placeholder="Search tasks..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
          >
            <Option value="all">All Statuses</Option>
            <Option value="todo">To Do</Option>
            <Option value="in-progress">In Progress</Option>
            <Option value="completed">Completed</Option>
          </Select>
          <Select
            value={priorityFilter}
            onChange={setPriorityFilter}
            style={{ width: 150 }}
          >
            <Option value="all">All Priorities</Option>
            <Option value="high">High</Option>
            <Option value="medium">Medium</Option>
            <Option value="low">Low</Option>
          </Select>
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 150 }}
          >
            <Option value="all">All Types</Option>
            <Option value="task">Regular Task</Option>
            <Option value="meal">Meal</Option>
            <Option value="water">Water</Option>
            <Option value="sleep">Sleep</Option>
            <Option value="schedule">Schedule</Option>
          </Select>
        </Space>
        <Space>
          <Select
            value={groupBy}
            onChange={setGroupBy}
            style={{ width: 150 }}
            prefix={<GroupOutlined />}
          >
            <Option value="none">No Grouping</Option>
            <Option value="status">Group by Status</Option>
            <Option value="priority">Group by Priority</Option>
            <Option value="type">Group by Type</Option>
          </Select>
        </Space>
      </div>

      {groupBy === 'none' ? (
        <Table
          columns={columns}
          dataSource={sortedTasks}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          rowClassName={(record) => record.status === 'completed' ? 'completed-task' : ''}
        />
      ) : (
        Object.entries(groupedTasks).map(([group, tasks]) => (
          <div key={group} style={{ marginBottom: 24 }}>
            <Title level={4} style={{ marginBottom: 16 }}>
              {group === 'undefined' ? 'Uncategorized' : group}
            </Title>
            <Table
              columns={columns}
              dataSource={tasks}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              rowClassName={(record) => record.status === 'completed' ? 'completed-task' : ''}
            />
          </div>
        ))
      )}

      <Modal
        title="Edit Task"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => setEditModalVisible(false)}
      >
        <Form form={form} layout="vertical">
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
            <Input.TextArea rows={4} />
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
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .completed-task {
          opacity: 0.7;
          background-color: ${isDarkMode ? '#1f1f1f' : '#f5f5f5'};
        }
        .ant-table-row:hover .completed-task {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default TaskListView; 