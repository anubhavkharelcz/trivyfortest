const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware with intentional security issues for demonstration
app.use(cors({
    origin: '*', // Overly permissive CORS - security issue
    credentials: true
}));

// Using helmet but with disabled features (security anti-pattern)
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' })); // Large payload limit - potential DoS
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Trivy Security Demo Application',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        nodeVersion: process.version
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Vulnerable endpoint - demonstrates potential security issues
app.get('/env', (req, res) => {
    // This endpoint demonstrates potential security issues
    // In a real application, exposing environment variables could be risky
    res.json({
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        // Note: In production, never expose sensitive environment variables
        environment: process.env.NODE_ENV || 'development',
        demoMode: true
    });
});

// XSS vulnerability demonstration (for educational purposes)
app.get('/user/:username', (req, res) => {
    const { username } = req.params;
    
    // Demonstrate potential XSS vulnerability (for educational purposes)
    // In production, always sanitize user input
    const html = `
    
    
        
            User Profile
            
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #333; }
                .profile { background: #f5f5f5; padding: 20px; border-radius: 8px; }
            
        
        
            User Profile
            
                Welcome, ${username}!
                This is a demo application for Trivy security scanning.
                Node.js version: ${process.version}
            
        
    
    `;
    
    res.send(html);
});

// Endpoint with potential ReDoS vulnerability
app.get('/search', (req, res) => {
    const { query } = req.query;
    
    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    // Vulnerable regex pattern that could cause ReDoS attacks
    const vulnerableRegex = /^(a+)+$/;
    
    try {
        const isMatch = vulnerableRegex.test(query);
        res.json({
            query,
            isValid: isMatch,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Processing error' });
    }
});

// File upload endpoint with potential path traversal vulnerability
app.post('/upload', (req, res) => {
    const { filename, content } = req.body;
    
    if (!filename || !content) {
        return res.status(400).json({ error: 'Filename and content are required' });
    }
    
    // Vulnerable: No path sanitization (path traversal vulnerability)
    // In production, always validate and sanitize file paths
    const filePath = path.join(__dirname, 'uploads', filename);
    
    res.json({
        message: 'File would be uploaded to: ' + filePath,
        filename,
        size: content.length,
        warning: 'This is a demo - files are not actually saved'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        // Potential information disclosure - showing stack trace
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Node version: ${process.version}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});