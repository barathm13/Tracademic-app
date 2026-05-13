# Smart Student Task & Attendance Tracker

A complete beginner-friendly full-stack web application for students to manage study tasks and daily attendance. The app uses **HTML, CSS, Vanilla JavaScript, Supabase Authentication, and Supabase PostgreSQL**. There is no Node.js backend, Express server, Firebase, TypeScript, or complex framework, so it can be deployed as a static site on Vercel or Netlify.

## Features

- Student registration with name, email, and password
- Secure Supabase email/password login and logout
- Session persistence after refresh
- Protected dashboard that redirects unauthenticated users to login
- Create, edit, delete, search, and filter tasks
- Mark tasks as pending or completed
- Mark attendance as Present or Absent only once per day
- Automatic attendance percentage calculation
- Dashboard summary cards for total, completed, and pending tasks
- Task completion donut chart built with CSS
- Toast notifications and validation messages
- Responsive blue/white card UI with glassmorphism styling
- Dark mode toggle saved in local storage

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| Deployment | Vercel, Netlify, or any static host |

## Project Structure

```text
student-task-attendance/
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── css/
│   └── style.css
├── js/
│   ├── supabase.js
│   ├── auth.js
│   └── dashboard.js
├── sql/
│   └── schema.sql
├── assets/
└── README.md
```

## Supabase Setup

1. Create a new project at [Supabase](https://supabase.com/).
2. Open **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `sql/schema.sql` and run it.
4. Go to **Project Settings → API**.
5. Copy your **Project URL** and **anon public key**.
6. Open `js/supabase.js` and replace:

```js
const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-SUPABASE-ANON-KEY';
```

with your actual Supabase values.

### Authentication Notes

- The schema includes Row Level Security policies so students can only access their own profile, tasks, and attendance.
- The schema also includes a trigger that creates a profile automatically after registration.
- If Supabase email confirmation is enabled, students must confirm their email before login.
- For local testing, add your local URL in Supabase under **Authentication → URL Configuration** if needed.

## Run Locally

Because this is a static project, you can open `index.html` directly. For a more deployment-like local setup, run a small static server:

```bash
python3 -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

## Deploy to Vercel

1. Push this project to GitHub.
2. Open [Vercel](https://vercel.com/) and import the repository.
3. Keep framework preset as **Other** or **Static**.
4. Set output/build settings to default because no build step is required.
5. Deploy.
6. Add your deployed URL to Supabase **Authentication → URL Configuration → Site URL**.

## Deploy to Netlify

1. Push this project to GitHub.
2. Open [Netlify](https://www.netlify.com/) and create a new site from Git.
3. Leave build command empty.
4. Leave publish directory as the project root.
5. Deploy.
6. Add your deployed URL to Supabase **Authentication → URL Configuration → Site URL**.

## Screenshots

Add screenshots after deployment or local testing:

- Login page
- Register page
- Dashboard desktop view
- Dashboard mobile view

## Database Tables

### profiles

| Column | Purpose |
| --- | --- |
| id | Supabase auth user id |
| name | Student name |
| email | Student email |
| created_at | Profile creation timestamp |

### tasks

| Column | Purpose |
| --- | --- |
| id | Task id |
| user_id | Owner student id |
| title | Task title |
| description | Optional task details |
| due_date | Task due date |
| status | Pending or Completed |
| created_at | Task creation timestamp |

### attendance

| Column | Purpose |
| --- | --- |
| id | Attendance id |
| user_id | Owner student id |
| date | Attendance date |
| status | Present or Absent |

## Customization Ideas

- Add course or subject fields to tasks.
- Add monthly attendance filters.
- Add profile editing.
- Add CSV export for attendance history.

## License

This project is free to use for learning, portfolio, and placement showcase purposes.
