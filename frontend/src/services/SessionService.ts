import axios from "axios";
import { store } from "../store";
import { setToken, logout } from "../store/slices/authSlice";

class SessionService {
  private lastActivity: number;
  private refreshInterval: number = 5 * 60 * 1000; // 5 minutes
  private checkInterval: number = 1 * 60 * 1000; // Check every minute
  private intervalId: NodeJS.Timeout | null = null;
  private readonly API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  constructor() {
    // Initialize with current time
    this.lastActivity = Date.now();

    // Bind methods
    this.trackActivity = this.trackActivity.bind(this);
    this.checkActivity = this.checkActivity.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.startMonitoring = this.startMonitoring.bind(this);
    this.stopMonitoring = this.stopMonitoring.bind(this);
  }

  /**
   * Update the last activity timestamp
   */
  trackActivity(): void {
    this.lastActivity = Date.now();
  }

  /**
   * Start monitoring user activity
   */
  startMonitoring(): void {
    if (this.intervalId) return;

    // Track meaningful user interactions
    document.addEventListener("click", this.trackActivity);
    document.addEventListener("keypress", this.trackActivity);
    document.addEventListener("submit", this.trackActivity);
    document.addEventListener("touchstart", this.trackActivity);

    // Start the interval to check activity and refresh token if needed
    this.intervalId = setInterval(this.checkActivity, this.checkInterval);

    // Set initial activity
    this.trackActivity();
  }

  /**
   * Stop monitoring user activity
   */
  stopMonitoring(): void {
    if (!this.intervalId) return;

    // Remove event listeners
    document.removeEventListener("click", this.trackActivity);
    document.removeEventListener("keypress", this.trackActivity);
    document.removeEventListener("submit", this.trackActivity);
    document.removeEventListener("touchstart", this.trackActivity);

    // Clear the interval
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  /**
   * Check if user has been active recently and refresh token if needed
   */
  private async checkActivity(): Promise<void> {
    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - this.lastActivity;

    // If user has been active in the last check interval, refresh the token
    if (timeSinceLastActivity < this.checkInterval) {
      try {
        const state = store.getState();
        const { token, refreshTokenLastUpdated } = state.auth;

        // Only refresh if we have a token and it hasn't been refreshed recently
        if (
          token &&
          currentTime - refreshTokenLastUpdated > this.refreshInterval
        ) {
          await this.refreshToken();
        }
      } catch (error) {
        console.error("Error checking activity:", error);
      }
    }
  }

  /**
   * Silently refresh the authentication token
   */
  private async refreshToken(): Promise<void> {
    try {
      const state = store.getState();
      const { token } = state.auth;

      if (!token) return;

      const response = await axios.post(
        `${this.API_URL}/refresh`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success && response.data.access_token) {
        // Update the token in the store with the access_token from response
        store.dispatch(
          setToken({
            token: response.data.access_token,
            refreshTokenLastUpdated: Date.now(),
          })
        );
      }
    } catch (error) {
      console.error("Error refreshing token:", error);

      // If refresh fails due to token expiration, log the user out
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        store.dispatch(logout());
      }
    }
  }
}

// Export a singleton instance
const sessionService = new SessionService();
export default sessionService;
