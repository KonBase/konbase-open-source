
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Get the repository name from environment variables or default to local development
const base = process.env.GITHUB_REPOSITORY 
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
  server: {
    port: 8080
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
