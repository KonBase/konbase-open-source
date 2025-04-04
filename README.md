
# KonBase Supply Management System

KonBase is a comprehensive inventory and convention management system built for associations that organize events and need to track their equipment and supplies.

## Key Features

### Association Management Module
- Association registration and profile management
- Inventory management with categorization and location tracking
- User management with permission levels
- Warranty and documentation tracking
- Equipment sets management
- Import/export functionality
- Local backup capabilities

### Convention Management Module
- Create convention from association template
- Equipment issuing and return tracking
- Consumable items tracking
- Room/location mapping
- Requirements gathering and fulfillment tracking
- Comprehensive logging of all actions
- Reports generation
- Post-convention archiving

### Security Features
- Role-based access control
- Super-admin role with full system access
- Enhanced security for log files
- Two-factor authentication for sensitive operations
- Data encryption for sensitive information

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Supabase account (for database and authentication)

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the database schema setup script from the `schema.sql` file in the SQL editor
3. Configure authentication providers as needed
4. Get your Supabase URL and anonymous key

### Installation

1. Clone the repository
   ```
   git clone https://github.com/ShiroLuxferre/KonBase.git
   cd konbase
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create an `.env.local` file with your Supabase credentials
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server
   ```
   npm run dev
   ```

5. Build for production
   ```
   npm run build
   ```

### GitHub Pages Deployment

To deploy to GitHub Pages:

1. Configure GitHub repository settings:
   - Go to Settings > Pages
   - Set source to GitHub Actions

2. Set up repository secrets:
   - SUPABASE_URL: Your Supabase project URL
   - SUPABASE_ANON_KEY: Your Supabase anonymous key

3. Push changes to the main branch to trigger automatic deployment

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or create an issue on the project repository:
[https://github.com/ShiroLuxferre/KonBase](https://github.com/ShiroLuxferre/KonBase)

## Technologies Used

- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Supabase for backend (database, auth, storage)
- Tanstack Query for data fetching
- shadcn/ui for components
- Recharts for data visualization

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Supabase](https://supabase.com) for the backend infrastructure
- [shadcn/ui](https://ui.shadcn.com) for the component library
