
# KonBase Supply Management System

<div align="center">
  <img src="/lovable-uploads/23ec7a1d-12fd-47d9-b8eb-080c0d7c18e5.png" alt="KonBase Logo" width="100" />
</div>

<p align="center">
  <a href="https://github.com/ShiroLuxferre/KonBase/stargazers">
    <img src="https://img.shields.io/github/stars/ShiroLuxferre/KonBase" alt="Stars" />
  </a>
  <a href="https://github.com/ShiroLuxferre/KonBase/network/members">
    <img src="https://img.shields.io/github/forks/ShiroLuxferre/KonBase" alt="Forks" />
  </a>
  <a href="https://github.com/ShiroLuxferre/KonBase/issues">
    <img src="https://img.shields.io/github/issues/ShiroLuxferre/KonBase" alt="Issues" />
  </a>
  <a href="./LICENSE.md">
    <img src="https://img.shields.io/github/license/ShiroLuxferre/KonBase" alt="License" />
  </a>
</p>

KonBase is a comprehensive inventory and convention management system built for associations that organize events and need to track their equipment and supplies.

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [Community](#community)
- [License](#license)

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

## Tech Stack

KonBase is built using modern web technologies:

### Frontend
- **React** - A JavaScript library for building user interfaces
- **TypeScript** - Static typing for better developer experience
- **Vite** - Next generation frontend tooling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Reusable UI components built with Radix UI and Tailwind CSS
- **React Router** - Routing library for React
- **Lucide Icons** - Beautiful open source icons
- **React Hook Form** - Form validation
- **Recharts** - Data visualization components

### Backend
- **Supabase** - Open source Firebase alternative
  - PostgreSQL database
  - Authentication
  - Storage
  - Edge Functions
  - Realtime subscriptions
- **Tanstack Query** - Asynchronous state management

### Deployment
- **GitHub Pages** - For static site hosting
- **GitHub Actions** - CI/CD for automatic deployment

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

We welcome contributions to KonBase! Here's how you can help:

### Ways to Contribute

- **Code Contributions**: Fix bugs, add features, improve performance
- **Documentation**: Improve or expand documentation
- **Bug Reports**: Submit issues for any bugs you encounter
- **Feature Requests**: Suggest new features or improvements
- **Testing**: Help test the application and provide feedback

### Contribution Process

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Write tests for new features
- Update documentation for significant changes

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `style:` for code style changes
- `refactor:` for code refactoring
- `test:` for tests
- `chore:` for build process or auxiliary tool changes

## Community

Join our community to get help, share ideas, and connect with other KonBase users:

- **Discord**: Join our [Discord server](https://discord.gg/konbase) for discussions and support
- **GitHub Issues**: Report bugs or request features through [GitHub Issues](https://github.com/ShiroLuxferre/KonBase/issues)
- **Discussions**: Participate in [GitHub Discussions](https://github.com/ShiroLuxferre/KonBase/discussions) for general topics

### Support the Project

If you find KonBase helpful, consider supporting the project:

- **GitHub Sponsors**: Support the development team directly through GitHub
- **Buy Me a Coffee**: [Buy us a coffee](https://www.buymeacoffee.com/konbase) to fuel development

## License

KonBase is licensed under the [GNU General Public License v3.0](./LICENSE.md) - see the LICENSE.md file for details.

---

<p align="center">
  Made with ❤️ by the KonBase community
</p>
