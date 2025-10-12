// Enhanced rate limiting
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.messageLimits = new Map();
  }

  checkIPRateLimit(ip, maxRequests = 100, windowMs = 900000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(ip)) {
      this.requests.set(ip, []);
    }
    
    const requests = this.requests.get(ip);
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(ip, recentRequests);
    return true;
  }

  checkMessageRateLimit(userId, maxMessages = 30, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.messageLimits.has(userId)) {
      this.messageLimits.set(userId, []);
    }
    
    const messages = this.messageLimits.get(userId);
    const recentMessages = messages.filter(time => time > windowStart);
    
    if (recentMessages.length >= maxMessages) {
      return false;
    }
    
    recentMessages.push(now);
    this.messageLimits.set(userId, recentMessages);
    return true;
  }

  cleanup() {
    const now = Date.now();
    
    for (const [ip, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => now - time < 900000);
      if (recentRequests.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, recentRequests);
      }
    }
    
    for (const [userId, messages] of this.messageLimits.entries()) {
      const recentMessages = messages.filter(time => now - time < 60000);
      if (recentMessages.length === 0) {
        this.messageLimits.delete(userId);
      } else {
        this.messageLimits.set(userId, recentMessages);
      }
    }
  }
}

module.exports = RateLimiter;


