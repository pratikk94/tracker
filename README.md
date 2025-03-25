# Task Tracker

A Kanban-style task tracking application with performance analytics, built with Next.js and Firebase.

## Features

- **Kanban Board**: Track tasks across different stages (To Do, In Progress, Completed)
- **Priority Levels**: Distinguish between high, medium, and low priority tasks
- **Task Deadlines**: Set and track deadlines for tasks
- **Performance Metrics**: Calculate and visualize task completion metrics
- **Recurring Tasks**: Create and manage recurring daily tasks
- **Daily Logging**: Track wake-up time, sleep time, and work hours
- **Analytics Dashboard**: Visualize your productivity trends

## Prerequisites

- Node.js 14.x or higher
- npm or yarn
- Firebase account (for authentication and database)

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/task-tracker.git
cd task-tracker
```

2. Install the dependencies:
```bash
npm install
# or
yarn install
```

3. Configure Firebase:
   - Create a new Firebase project at https://console.firebase.google.com/
   - Enable Authentication (Email/Password) and Firestore Database
   - Create a `.env.local` file in the root directory using the `.env.local.example` as a template
   - Add your Firebase project credentials to the `.env.local` file

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Authentication
- Register a new account or log in with existing credentials
- All tasks and logs are user-specific

### Task Management
- Create new tasks with title, description, priority, and deadline
- Drag and drop tasks between the Kanban columns to update their status
- Edit or delete tasks as needed
- Set tasks as recurring (daily, weekly, or monthly)

### Daily Logging
- Track your wake-up time with a single click
- Log your sleep time
- Record work start and end times
- View daily performance score based on task completion and time tracking

### Analytics
- View comprehensive performance metrics
- Analyze task completion rates
- Track work hours and productivity trends
- Monitor sleep patterns and their correlation with productivity

### Admin Panel
- Manage recurring tasks
- Manually trigger recurring task processing

## Technologies Used

- Next.js 14
- React 18
- TypeScript
- Firebase (Authentication, Firestore)
- Chart.js
- React Beautiful DnD (drag and drop)
- date-fns

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request. 