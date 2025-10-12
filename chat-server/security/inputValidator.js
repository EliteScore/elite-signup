// Input validation
class InputValidator {
  static validateMessage(message) {
    const errors = [];
    let field = 'general';
    
    // Validate content
    if (!message.content) {
      errors.push('Message content is required');
      field = 'content';
    } else if (typeof message.content !== 'string') {
      errors.push('Message content must be a string');
      field = 'content';
    } else if (message.content.trim().length === 0) {
      errors.push('Message content cannot be empty');
      field = 'content';
    } else if (message.content.length > 1000) {
      errors.push(`Message content cannot exceed 1000 characters (current: ${message.content.length})`);
      field = 'content';
    }
    
    // Validate recipient ID
    if (!message.recipientId) {
      errors.push('Recipient ID is required');
      field = 'recipientId';
    } else if (typeof message.recipientId !== 'string' && typeof message.recipientId !== 'number') {
      errors.push('Recipient ID must be a string or number');
      field = 'recipientId';
    } else if (typeof message.recipientId === 'string' && message.recipientId.trim().length === 0) {
      errors.push('Recipient ID cannot be empty');
      field = 'recipientId';
    }
    
    // Check for harmful content - improved XSS detection
    const harmfulPatterns = [
      { pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, name: 'script tags' },
      { pattern: /javascript:/gi, name: 'javascript protocol' },
      { pattern: /on\w+\s*=/gi, name: 'event handlers' },
      { pattern: /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, name: 'iframe tags' },
      { pattern: /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, name: 'object tags' },
      { pattern: /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, name: 'embed tags' },
      { pattern: /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, name: 'link tags' },
      { pattern: /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi, name: 'meta tags' }
    ];
    
    // Check for harmful patterns if content contains HTML-like content or suspicious patterns
    if (/[<>]/.test(message.content) || /script|javascript|on\w+\s*=|iframe|object|embed/i.test(message.content)) {
      for (const { pattern, name } of harmfulPatterns) {
        if (pattern.test(message.content)) {
          errors.push(`Message contains potentially harmful content: ${name}`);
          field = 'content';
          break;
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors,
      field: field,
      sanitizedContent: this.sanitizeContent(message.content)
    };
  }

  static sanitizeContent(content) {
    if (!content) return '';
    
    let sanitized = content.replace(/<[^>]*>/g, '');
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    
    return sanitized.trim();
  }

  static validateJWTToken(token) {
    if (!token || typeof token !== 'string') {
      return { isValid: false, error: 'Token is required and must be a string' };
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, error: 'Invalid JWT token format' };
    }
    
    try {
      parts.forEach(part => {
        if (part) {
          Buffer.from(part, 'base64');
        }
      });
    } catch (error) {
      return { isValid: false, error: 'Invalid JWT token encoding' };
    }
    
    return { isValid: true };
  }

  static validateUserId(userId) {
    if (!userId || typeof userId !== 'string') {
      return { isValid: false, error: 'User ID is required and must be a string' };
    }
    
    const userIdPattern = /^[a-zA-Z0-9_-]+$/;
    if (!userIdPattern.test(userId)) {
      return { isValid: false, error: 'Invalid user ID format' };
    }
    
    if (userId.length > 255) {
      return { isValid: false, error: 'User ID too long' };
    }
    
    return { isValid: true };
  }
}

module.exports = InputValidator;


