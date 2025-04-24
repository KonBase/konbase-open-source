/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { componentTagger } from "lovable-tagger"
import rawPlugin from 'vite-plugin-raw'
import fs from 'fs'; // Import Node.js fs module
import { IncomingMessage, ServerResponse } from 'http'; // Import types for request/response

// Ensure logs directory exists
const logsDir = path.resolve(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}
const logFilePath = path.resolve(logsDir, 'dev-errors.log');

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    rawPlugin({
      match: /\.sql$/,
    }),
    mode === 'development' && componentTagger(),
    // Add middleware for logging errors only in development
    mode === 'development' && {
      name: 'error-log-middleware',
      configureServer(server: { middlewares: { use: (path: string, handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void } }) {
        interface LogEntry {
          timestamp: string;
          level: string;
          message: string;
          data?: string;
          stack?: string;
        }

        server.middlewares.use('/log-error', (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const logEntry: LogEntry = JSON.parse(body);
            const logLine = `[${logEntry.timestamp}] [${logEntry.level.toUpperCase()}] ${logEntry.message}${logEntry.data ? '\nData: ' + logEntry.data : ''}${logEntry.stack ? '\nStack: ' + logEntry.stack : ''}\n---\n`;
            
            // Append to the log file
            fs.appendFile(logFilePath, logLine, (err: NodeJS.ErrnoException | null) => {
          if (err) {
            console.error('Failed to write to log file:', err);
          }
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Log received' }));
          } catch (e) {
            console.error('Error processing log request:', e);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
          } else {
        // Handle other methods or pass through
        next();
          }
        });
      }
    }
  ].filter(Boolean),
  base: '/',
  server: {
    port: 8080,
    host: "::",
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Ensure assets are properly referenced with the base path
    assetsDir: 'assets',
    // Make sure paths are correctly prefixed with base
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  test: { // Add this test configuration block
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts', // Optional: Create this file for global test setup
    css: true, // If you need to process CSS in tests
  },
}))
