'use client';

import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, Typography, Badge } from 'antd';
import { Task, TaskStatus } from '@/lib/types';
import TaskCard from './TaskCard';
import { 
  ClockCircleOutlined, 
  SyncOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons';

const { Title } = Typography;

interface KanbanBoardProps {
  tasks: { [key in TaskStatus]: Task[] };
  onDragEnd: (result: any) => void;
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskEdit: (task: Task) => void;
}

const columnStyles = {
  todo: {
    backgroundColor: '#fff1f0',
    borderTop: '5px solid #ff4d4f',
    borderRadius: '8px',
  },
  'in-progress': {
    backgroundColor: '#e6f4ff',
    borderTop: '5px solid #1890ff',
    borderRadius: '8px',
  },
  completed: {
    backgroundColor: '#f6ffed',
    borderTop: '5px solid #52c41a',
    borderRadius: '8px',
  }
};

const columnIcons = {
  todo: <ClockCircleOutlined style={{ color: '#ff4d4f', fontSize: '28px' }} />,
  'in-progress': <SyncOutlined spin style={{ color: '#1890ff', fontSize: '28px' }} />,
  completed: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '28px' }} />
};

const columnTitles = {
  todo: 'TO DO',
  'in-progress': 'DOING',
  completed: 'DONE'
};

const columnColors = {
  todo: '#ff4d4f',
  'in-progress': '#1890ff',
  completed: '#52c41a'
};

export default function KanbanBoard({ tasks, onDragEnd, onTaskStatusChange, onTaskDelete, onTaskEdit }: KanbanBoardProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    handleResize();
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="kanban-container" style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        gap: '16px',
        width: '100%'
      }}>
        {Object.entries(tasks).map(([status, columnTasks]) => (
          <Droppable key={status} droppableId={status}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="kanban-column"
                style={{
                  flex: '1 1 0px',
                  width: isMobile ? '100%' : '33.33%',
                  minHeight: isMobile ? '300px' : '500px',
                  marginBottom: isMobile ? '16px' : '0'
                }}
              >
                <Card
                  title={
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      flexDirection: 'column',
                      textAlign: 'center',
                      padding: '12px 0'
                    }}>
                      <div>
                        {columnIcons[status as TaskStatus]}
                      </div>
                      <Title level={4} style={{ 
                        margin: '4px 0',
                        color: columnColors[status as TaskStatus]
                      }}>
                        {columnTitles[status as TaskStatus]}
                      </Title>
                      <Badge 
                        count={columnTasks.length} 
                        style={{ 
                          backgroundColor: columnColors[status as TaskStatus],
                          fontSize: '14px'
                        }} 
                      />
                    </div>
                  }
                  style={{
                    ...columnStyles[status as TaskStatus],
                    height: '100%',
                    boxShadow: snapshot.isDraggingOver ? '0 0 10px rgba(0,0,0,0.1)' : 'none',
                    transition: 'box-shadow 0.2s ease'
                  }}
                  bodyStyle={{ 
                    padding: '12px', 
                    height: 'calc(100% - 140px)',
                    overflowY: 'auto' 
                  }}
                  headStyle={{ 
                    borderBottom: `1px dashed ${status === 'completed' ? '#52c41a' : 
                                            status === 'in-progress' ? '#1890ff' : '#ff4d4f'}`,
                    padding: '0'
                  }}
                >
                  <div style={{ 
                    minHeight: isMobile ? '250px' : '400px',
                    backgroundColor: snapshot.isDraggingOver ? 'rgba(255,255,255,0.5)' : 'transparent',
                    transition: 'background-color 0.2s ease',
                    borderRadius: '4px',
                    padding: '4px'
                  }}>
                    {columnTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.8 : 1
                            }}
                          >
                            <TaskCard
                              task={task}
                              onStatusChange={onTaskStatusChange}
                              onDelete={onTaskDelete}
                              onEdit={onTaskEdit}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </Card>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
} 