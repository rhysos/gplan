
# Garden Planner Application

A Next.js application for planning and managing garden layouts with an interactive UI for arranging flowers in rows.

## Features

### User Authentication
- Secure login and signup functionality
- Protected dashboard routes
- Session management

### Garden Management
- Create multiple gardens
- Rename and delete gardens
- Switch between different gardens using the dropdown menu

### Row Management
- Add rows with customizable lengths and end spaces
- Edit row properties (name, length, end spaces)
- Delete rows
- Visual representation of row space usage

### Plant Management
- Add plants to rows with specific spacing requirements
- Move plants left or right within rows
- Remove plants from rows
- Track plant inventory and usage
- Visual feedback for plant placement and spacing

### Plant Inventory
- Manage available plants/flowers
- Track quantity and usage of each plant
- Upload plant images via Cloudinary
- Edit plant details (name, spacing, quantity)

## Technical Stack

- **Frontend**: Next.js 15.2.4, React 19
- **UI Components**: shadcn/ui, Radix UI
- **Styling**: Tailwind CSS
- **Image Handling**: Cloudinary
- **Database**: Neon (Serverless Postgres)
- **Authentication**: Custom session-based auth

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```env
# Database
DATABASE_URL=your_neon_database_url

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. Run the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - React components including UI components
- `/lib` - Utility functions, database queries, and server actions
- `/hooks` - Custom React hooks
- `/public` - Static assets
- `/styles` - Global styles

## Key Components

### GardenPlanner
The main component that handles the garden planning interface. Features:
- Garden selection and management
- Row visualization and management
- Plant placement and arrangement
- Space usage tracking

### FlowerManagement
Handles the plant inventory system:
- Plant creation and editing
- Quantity tracking
- Image management
- Usage statistics

## Database Schema

The application uses the following main tables:
- `users` - User accounts
- `gardens` - User gardens
- `rows` - Garden rows
- `plants` - Plant definitions
- `plant_instances` - Plant placements in rows

## Authentication Flow

1. Users sign up/login through `/login` or `/signup`
2. Session is created and stored
3. Protected routes check session validity
4. Middleware handles route protection

## Development Guidelines

- Use server actions for database operations
- Implement optimistic updates for better UX
- Handle loading and error states
- Validate inputs on both client and server
- Use proper TypeScript types

## Error Handling

The application includes:
- Error boundaries for component-level errors
- Toast notifications for user feedback
- Form validation with proper error messages
- Database error handling

## Performance Considerations

- Optimistic updates for UI operations
- Proper loading states
- Image optimization via Cloudinary
- Efficient database queries

## Security Features

- Protected API routes
- Session-based authentication
- Input sanitization
- Secure password handling
- Environment variable protection
