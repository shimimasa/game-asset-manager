import { Request, Response, NextFunction } from 'express';
import compression from 'compression';

// Response compression middleware
export const compressionMiddleware = compression({
  // Enable compression for responses larger than 1KB
  threshold: 1024,
  // Compression level (0-9, where 9 is maximum compression)
  level: 6,
  // Filter function to determine if response should be compressed
  filter: (req: Request, res: Response) => {
    // Don't compress responses with no-compression header
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Use compression's default filter function
    return compression.filter(req, res);
  },
});

// ETag generation for caching
export function etagMiddleware(req: Request, res: Response, next: NextFunction) {
  // Generate ETag for GET requests
  if (req.method === 'GET') {
    const originalJson = res.json;
    
    res.json = function(data: any) {
      // Generate simple ETag based on content
      const etag = `"${Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 27)}"`;
      
      res.set('ETag', etag);
      
      // Check if client has matching ETag
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }
      
      return originalJson.call(this, data);
    };
  }
  
  next();
}

// Add cache control headers
export function cacheControlMiddleware(req: Request, res: Response, next: NextFunction) {
  // Set cache headers based on route
  if (req.method === 'GET') {
    // Public assets can be cached longer
    if (req.path.startsWith('/api/assets/download')) {
      res.set('Cache-Control', 'public, max-age=31536000'); // 1 year
    }
    // API responses should have shorter cache
    else if (req.path.startsWith('/api/')) {
      res.set('Cache-Control', 'private, max-age=60'); // 1 minute
    }
  }
  
  next();
}

// Request deduplication middleware
const pendingRequests = new Map<string, Promise<any>>();

export function deduplicationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only deduplicate GET requests
  if (req.method !== 'GET') {
    return next();
  }
  
  // Generate request key
  const key = `${req.user?.userId || 'anonymous'}:${req.method}:${req.originalUrl}`;
  
  // Check if request is already pending
  const pending = pendingRequests.get(key);
  if (pending) {
    // Wait for pending request
    pending
      .then((cachedResponse) => {
        res.status(cachedResponse.status).json(cachedResponse.data);
      })
      .catch(() => {
        // If pending request failed, process this request normally
        next();
      });
    return;
  }
  
  // Create promise for this request
  const responsePromise = new Promise((resolve, reject) => {
    const originalJson = res.json;
    const originalStatus = res.status;
    let statusCode = 200;
    
    // Override status to capture it
    res.status = function(code: number) {
      statusCode = code;
      return originalStatus.call(this, code);
    };
    
    // Override json to capture response
    res.json = function(data: any) {
      // Store response
      resolve({ status: statusCode, data });
      
      // Clean up
      pendingRequests.delete(key);
      
      // Send response
      return originalJson.call(this, data);
    };
    
    // Handle errors
    const originalNext = next;
    next = function(error?: any) {
      if (error) {
        reject(error);
        pendingRequests.delete(key);
      }
      return originalNext(error);
    };
  });
  
  // Store pending request
  pendingRequests.set(key, responsePromise);
  
  // Set timeout to clean up
  setTimeout(() => {
    pendingRequests.delete(key);
  }, 30000); // 30 seconds
  
  next();
}