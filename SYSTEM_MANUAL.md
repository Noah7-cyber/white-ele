# White Penguin Project - Comprehensive System Manual

Welcome to the White Penguin Project! This manual serves as a complete guide to understanding, setting up, running, and exploring the entirety of the application. It is designed to be read like a book, taking you through the architecture, technologies, setup instructions, and the complex web of modules and API endpoints that make the system function.

---

## Chapter 1: Introduction & High-Level Architecture

The White Penguin Project is a full-stack web application tailored for managing educational/school environments. Its architecture is divided into two main components:
1.  **Frontend**: A modern, interactive user interface built with **React** and **Next.js**.
2.  **Backend**: A robust, scalable API built with **Node.js** and **Express**, written in **TypeScript**.
3.  **Database**: A relational database powered by **PostgreSQL** (with optional MySQL support), managed via the **TypeORM** ORM.

### How They Connect
- The **Frontend** runs in the user's browser, sending HTTP requests (and WebSocket connections for real-time events) to the backend API.
- The **Backend** acts as the central hub. It receives requests, performs business logic, checks permissions (Role-Based Access Control / RBAC), interacts with the database, and returns data (usually in JSON format).
- The **Database** is the persistent storage layer where all data (users, students, schools, classes, attendance, etc.) is kept safe.

---

## Chapter 2: Technologies and Concepts

### 2.1 The Frontend Stack
- **Next.js 15**: A React framework that enables features such as server-side rendering and generating static websites.
- **React 19**: The core library for building the user interfaces.
- **Redux & Redux Toolkit**: Used for global state management (e.g., keeping track of the logged-in user or active theme).
- **Tailwind CSS & PostCSS**: Used for rapid, utility-first styling.
- **Material UI (MUI) & Joy UI**: Component libraries that provide pre-built, accessible UI elements (buttons, modals, inputs, charts).
- **React Query**: Handles data fetching, caching, and synchronization with the backend API.
- **React Hook Form**: For building and validating complex forms efficiently.

### 2.2 The Backend Stack
- **Node.js & Express**: The runtime and web framework used to build the RESTful API. Express handles routing and middleware.
- **TypeScript**: Adds static typing to JavaScript, making the code much more predictable, readable, and easier to refactor.
- **TypeORM**: An Object-Relational Mapper. Instead of writing raw SQL queries, developers define "Entities" (TypeScript classes) which TypeORM automatically translates into database tables and queries.
- **PostgreSQL**: The primary relational database used to store data safely.
- **Jest**: The testing framework used to ensure code quality through unit and End-to-End (e2e) tests.
- **Socket.io**: Enables real-time, bi-directional communication between the web client and server (e.g., instant notifications).

### 2.3 Core Concepts
- **Modular Architecture**: The backend is organized into "modules" (e.g., `auth`, `student`, `school`). Each module contains its own routes, controllers, services, and database entities.
- **RBAC (Role-Based Access Control)**: Access to various parts of the API is controlled dynamically based on the user's role (e.g., Super Admin, School Admin, Teacher, Parent).
- **Tenant Context / Subdomains**: The application handles multiple schools (multi-tenancy) often checking `X-School-Id` headers or routing through subdomains.

---

## Chapter 3: Setup, Running, and Testing Locally

### 3.1 Prerequisites
You will need installed on your machine:
- **Node.js** (v20+ recommended)
- **npm** or **yarn**
- **PostgreSQL** (Running locally, or a remote string like Neon Tech)

### 3.2 Backend Setup
1. Open a terminal and navigate to the `backend/` directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file in the `backend/` root directory. At a minimum, you need database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_postgres_user
   DB_PASSWORD=your_postgres_password
   DB_NAME=cw_backend
   DB_TYPE=postgres
   NODE_ENV=dev
   ```
4. **Database Setup**: Start your local postgres server. Then run:
   ```bash
   npm run db:setup
   ```
   *This command runs migrations to create tables and seeds the database with initial data like countries, roles, and default super admins.*
5. **Start the Server**:
   ```bash
   npm run dev
   ```
   The backend will start at `http://localhost:3000` (or `3001`). You can verify by visiting `http://localhost:3000/health`.

### 3.3 Frontend Setup
1. Open a new terminal and navigate to the `frontend/` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Visit `http://localhost:3000` in your browser. (Note: Ensure the frontend and backend run on different ports if running locally).

### 3.4 Running Tests
- **Backend**: Inside the `backend/` folder, run `npm test` to run the Jest test suites.
- **Linting**: Both frontend and backend support `npm run lint` to check for code style issues.

---

## Chapter 4: Core Modules Explanation

The backend `src/modules/` directory is the heart of the application. Here are the most critical modules explained:

1. **Auth (`/auth`)**: Handles user authentication. It issues JSON Web Tokens (JWT) for secure login, handles password resets, and supports OAuth (Google, Facebook, LinkedIn).
2. **User & Roles (`/users`, `/roles`, `/profile`)**: Manages individual user accounts, their profiles, and assigns roles (Admin, Teacher, etc.) to control what they can and cannot do.
3. **School (`/school`)**: The core entity for multi-tenancy. Everything in the system (classrooms, students, staff) usually belongs to a specific school.
4. **Classroom & Classroom Activity (`/classroom`)**: Manages classes, grade levels, and the daily activities happening within them.
5. **Student & Parent (`/students`, `/parents`)**: Manages the student directory, their documents, medical information, emergency contacts, and maps students to their parents/guardians.
6. **Attendance (`/attendance`)**: Tracks daily presence, absence, and tardiness for students and staff.
7. **Assessment & Milestone (`/assessments`, `/milestones`)**: For tracking educational progress, grades, and developmental milestones.
8. **Notification (`/notifications`)**: A complex system handling in-app alerts (via WebSockets), emails (SendGrid/Resend), and even WhatsApp webhooks.
9. **Event (`/tour-events`, `/tour-bookings`)**: Manages school tours, open days, and bookings made by prospective parents.
10. **Invoice & Subscription (`/invoices`, `/subscriptions`)**: Financial management for school billing and the schools' own subscriptions to the White Penguin platform.
11. **Shared (`/shared`)**: Contains code used by multiple modules: file uploads (Multer/AWS S3), country/state data, activity logs, and global error handling.

---

## Chapter 5: Comprehensive Endpoint Reference

Below is a categorized list of the main API endpoints provided by the backend (Base URL: `http://localhost:<PORT>/api/v1`).

### 5.1 Authentication & Security
- `POST /auth/login` - Authenticate user and receive a token.
- `POST /auth/register` - Register a new user.
- `POST /auth/forgot-password` - Request a password reset link.
- `GET /sessions` - Manage active user login sessions.
- `GET /roles` - Fetch available system/school roles.

### 5.2 User Management
- `GET /profile` - Get the currently authenticated user's profile.
- `PUT /profile` - Update the user profile.
- `GET /account` - Get core account settings.
- `GET /users` - Fetch user statistics and directories.

### 5.3 School & Administration
- `GET /school` - List schools (or get tenant school details).
- `GET /staff` - Manage school staff members (teachers, admins).
- `GET /admins` - Manage administrative users.
- `GET /invitation` - Send and manage invites for staff/parents to join the school.
- `GET /analytics` - Get charts and data insights for the school's performance.

### 5.4 Academics & Students
- `GET /students` - Directory of students.
- `GET /parents` - Directory of parents and their linked students.
- `GET /medicals` - Health records for students.
- `GET /emergency` - Emergency contacts.
- `GET /student-documents` - Uploaded files (birth certificates, past grades).
- `GET /classroom` - List of classrooms/grades.
- `GET /curriculums` & `/subjects` - Academic framework and subjects taught.
- `GET /assessments` & `/milestones` - Grades and developmental tracking.
- `GET /portfolio` - A student's collection of work.

### 5.5 Daily Operations
- `GET /attendance` - Log and view attendance records.
- `GET /classroom-activity` - Real-time updates on what is happening in class.
- `GET /messaging` - Internal chat / messaging system.
- `GET /announcements` - School-wide broadcast messages.
- `GET /forms` - Custom forms/surveys created by the school.

### 5.6 Finance & Admissions
- `GET /invoices` - View and manage billing.
- `GET /subscriptions` - Manage the school's tier on the White Penguin platform.
- `GET /tour-events`, `/tour-availability`, `/tour-bookings` - The funnel for prospective parents to visit the school and apply.

### 5.7 System & Utilities
- `GET /health` - (Not versioned) Check if the server is alive.
- `POST /upload` - Upload an image or document.
- `GET /countries`, `/states`, `/cities` - Geographical reference data.
- `GET /activities`, `/activity-logs` - Audit trails (who did what, and when).
- `GET /notifications` - Fetch user alerts.
- `POST /notifications/whatsapp-webhook` - Endpoint for Twilio/WhatsApp integration.
- `GET /global-search` - Search across the entire application (students, staff, etc.).

---

*This manual was designed to give you a thorough, readable understanding of the White Penguin Project. As you navigate the codebase, keep this document handy to remember how the various pieces of the puzzle fit together.*
