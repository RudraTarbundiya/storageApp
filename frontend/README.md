# Cloud Storage Frontend

A professional and modern frontend application for Google Drive storage management.

## Features

- 🌓 **Dark/Light Theme** - Seamless theme switching with persistent preferences
- 🗂️ **File Management** - Upload, download, rename, and delete files
- 📁 **Folder Navigation** - Hierarchical folder structure with breadcrumb navigation
- ☁️ **Google Drive Integration** - Import files directly from Google Drive
- 🎨 **Modern UI** - Built with shadcn/ui components and Tailwind CSS v4
- ⚡ **Fast & Responsive** - Vite-powered React application
- 🔐 **Secure Authentication** - OTP-based email authentication

## Tech Stack

- **Framework**: React 19 + Vite
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **OAuth**: @react-oauth/google

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- Backend server running on http://localhost:4000
- Google OAuth Client ID (see [Google OAuth Setup Guide](./GOOGLE_OAUTH_SETUP.md))

### Installation

```bash
cd frontend
npm install
```

### Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Google OAuth Client ID:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   VITE_API_BASE_URL=http://localhost:4000
   ```

3. See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for detailed setup instructions

### Development

```bash
npm run dev
```

The application will be available at http://localhost:5173

### Build for Production

```bash
npm run build
```

## Pages

- `/login` - User login with OTP verification
- `/register` - New user registration
- `/dashboard` - Main file browser and management
- `/files` - All files view (same as dashboard)
- `/google-drive` - Google Drive integration

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout/          # Layout components (Header, Sidebar)
│   │   ├── ui/              # shadcn UI components
│   │   ├── BreadcrumbNav.jsx
│   │   ├── FileCard.jsx
│   │   ├── FolderCard.jsx
│   │   └── ThemeProvider.jsx
│   ├── lib/
│   │   ├── api.js           # API client and endpoints
│   │   └── utils.js         # Utility functions
│   ├── pages/
│   │   ├── DashboardPage.jsx
│   │   ├── GoogleDrivePage.jsx
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
└── package.json
```

## API Integration

The frontend communicates with the backend at `/api/*` (proxied to http://localhost:4000).

### Available API Endpoints

- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/google-login` - Verify OTP and login
- `POST /api/user` - Register new user
- `GET /api/directory` - Get root directory
- `GET /api/directory/:id` - Get directory contents
- `POST /api/file` - Upload file
- `GET /api/file/:id` - Download file
- `PATCH /api/file/:id` - Rename file
- `DELETE /api/file/:id` - Delete file
- `GET /api/gd/list-files` - List Google Drive files
- `POST /api/gd/import` - Import from Google Drive

## Theme

The application supports automatic dark/light theme switching with persistent localStorage storage.

### Color Palette

**Light Mode:**
- Primary: Blue (#3b82f6)
- Background: White (#ffffff)
- Card: White with subtle shadows

**Dark Mode:**
- Primary: Blue (#3b82f6)
- Background: Slate (#0f172a)
- Card: Dark slate (#1e293b)

## License

MIT