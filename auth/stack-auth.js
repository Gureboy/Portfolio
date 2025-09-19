// Stack Auth Integration for D&D Game

class StackAuthClient {
  constructor() {
    this.projectId = '9cbfab71-4487-4792-a2a3-a9cb0734a637';
    this.apiUrl = 'https://api.stack-auth.com/api/v1';
    this.jwksUrl = `${this.apiUrl}/projects/${this.projectId}/.well-known/jwks.json`;
    this.currentUser = null;
    this.token = localStorage.getItem('stack_auth_token');
  }

  // Initialize authentication
  async init() {
    try {
      if (this.token) {
        await this.validateToken();
      }
      return this.currentUser;
    } catch (error) {
      console.warn('Auth initialization failed:', error);
      this.logout();
      return null;
    }
  }

  // Validate existing token
  async validateToken() {
    if (!this.token) return false;
    
    try {
      const response = await fetch(`${this.apiUrl}/projects/${this.projectId}/users/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        this.currentUser = await response.json();
        return true;
      } else {
        throw new Error('Token validation failed');
      }
    } catch (error) {
      console.warn('Token validation error:', error);
      return false;
    }
  }

  // Login with email/password
  async login(email, password) {
    try {
      const response = await fetch(`${this.apiUrl}/projects/${this.projectId}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.access_token) {
        this.token = data.access_token;
        localStorage.setItem('stack_auth_token', this.token);
        this.currentUser = data.user;
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Register new user
  async register(email, password, displayName) {
    try {
      const response = await fetch(`${this.apiUrl}/projects/${this.projectId}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          display_name: displayName
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, message: 'Registration successful' };
      } else {
        return { success: false, error: data.message || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Logout
  logout() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('stack_auth_token');
  }

  // Get user profile
  getUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser && !!this.token;
  }
}

// Global auth instance
window.stackAuth = new StackAuthClient();
