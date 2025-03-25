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
    backgroundColor: '#fff2f0',
    borderTop: '3px solid #ff4d4f',
  },
  'in-progress': {
    backgroundColor: '#e6f7ff',
    borderTop: '3px solid #1890ff',
  },
  completed: {
    backgroundColor: '#f6ffed',
    borderTop: '3px solid #52c41a',
  }
};

const columnIcons = {
  todo: <ClockCircleOutlined style={{ color: '#ff4d4f' }} />,
  'in-progress': <SyncOutlined spin style={{ color: '#1890ff' }} />,
  completed: <CheckCircleOutlined style={{ color: '#52c41a' }} />
};

export default function KanbanBoard({ tasks, onDragEnd, onTaskStatusChange, onTaskDelete, onTaskEdit }: KanbanBoardProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '16px',
        padding: '16px'
      }}>
        {Object.entries(tasks).map(([status, columnTasks]) => (
          <Droppable key={status} droppableId={status}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  height: '100%',
                  minHeight: '500px'
                }}
              >
                <Card
                  style={{
                    ...columnStyles[status as TaskStatus],
                    height: '100%',
                    boxShadow: snapshot.isDraggingOver ? '0 0 10px rgba(0,0,0,0.1)' : 'none',
                    transition: 'box-shadow 0.2s ease'
                  }}
                  bodyStyle={{ padding: '12px', height: '100%' }}
                >
                  <div style={{ 
                    marginBottom: '16px', 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {columnIcons[status as TaskStatus]}
                    <Title level={5} style={{ margin: 0 }}>
                      {status.toUpperCase()}
                    </Title>
                    <Badge 
                      count={columnTasks.length} 
                      style={{ 
                        backgroundColor: status === 'completed' ? '#52c41a' : 
                                       status === 'in-progress' ? '#1890ff' : '#ff4d4f'
                      }} 
                    />
                  </div>
                  <div style={{ 
                    minHeight: '400px',
                    backgroundColor: snapshot.isDraggingOver ? 'rgba(255,255,255,0.5)' : 'transparent',
                    transition: 'background-color 0.2s ease',
                    borderRadius: '4px',
                    padding: '8px'
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