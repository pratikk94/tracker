'use client';

import React, { useContext } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Col, Empty, Tag, Spin } from 'antd';
import { Task, TaskStatus } from '@/lib/types';
import TaskCard from './TaskCard';
import { ThemeContext } from '@/app/providers';

interface KanbanBoardProps {
  tasks: { [key in TaskStatus]: Task[] };
  onDragEnd: (result: any) => void;
  onTaskUpdated: () => void;
  isDarkMode?: boolean;
  isLoading?: boolean;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tasks, 
  onDragEnd, 
  onTaskUpdated, 
  isDarkMode = false,
  isLoading = false
}) => {
  const themeContext = useContext(ThemeContext);
  const darkMode = isDarkMode || themeContext?.isDarkMode || false;

  const getColumnTitle = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return '';
    }
  };

  const getColumnColor = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return '#ff4d4f';
      case 'in-progress':
        return '#faad14';
      case 'completed':
        return '#52c41a';
      default:
        return '#1890ff';
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {(['todo', 'in-progress', 'completed'] as TaskStatus[]).map((status) => (
        <Col xs={24} md={8} key={status}>
          <div className="kanban-column">
            <div className="kanban-column-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Tag 
                  color={getColumnColor(status)} 
                  style={{ fontSize: '16px', padding: '4px 8px', margin: 0 }}
                >
                  {getColumnTitle(status)} ({tasks[status].length})
                </Tag>
              </div>
            </div>
            <Droppable droppableId={status}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{ minHeight: '60vh' }}
                >
                  {isLoading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                      <Spin />
                    </div>
                  ) : tasks[status].length === 0 ? (
                    <Empty description={`No ${getColumnTitle(status)} tasks`} style={{ margin: '40px 0' }} />
                  ) : (
                    tasks[status].map((task, index) => (
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
                              onTaskUpdated={onTaskUpdated}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </Col>
      ))}
    </DragDropContext>
  );
};

export default KanbanBoard; 