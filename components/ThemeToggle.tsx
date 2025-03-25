'use client';

import React, { useContext } from 'react';
import { Button, Tooltip } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { ThemeContext } from '@/app/providers';

const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <Button
        type="text"
        icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
        onClick={toggleTheme}
        className="theme-toggle"
        aria-label="Toggle theme"
      />
    </Tooltip>
  );
};

export default ThemeToggle; 