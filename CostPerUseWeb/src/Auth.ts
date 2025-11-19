import { useAuthStore } from './stores/auth';

class AuthService {
    // private apiBase = 'http://api.yuany3721.site';
    private apiBase = import.meta.env.VITE_API_BASE;
    private authStore: any = null;

    // 延迟初始化 authStore
    private getStore() {
        if (!this.authStore) {
            this.authStore = useAuthStore();
        }
        return this.authStore;
    }
    async validateAuth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.apiBase}/auth/validate?token=${this.getStore().token}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // console.log('认证验证响应数据:', data);

            if (data.payload) {
                this.getStore().userInfo = data.payload;
            }
            // console.log('当前用户信息:', this.getStore().userInfo.groups, this.getStore().userInfo.groups.includes('Home'));

            return data.valid;
        } catch (error) {
            console.error('validateAuth failed:', error);
            return false;
        }
    }

    async startLogin(redirect_url: string): Promise<void> {
        try {
            const response = await fetch(`${this.apiBase}/auth/login?redirect_url=${encodeURIComponent(redirect_url)}`);
            const data = await response.json();

            // console.log('获取登录URL响应数据:', data);

            // 重定向到OAuth登录页面
            window.location.href = data.login_url;
        } catch (error) {
            // console.error('获取登录URL失败:', error);
            throw error;
        }
    }

    // 获取用户信息
    getUserInfo() {
        return this.getStore().userInfo;
    }

    // 检查是否已认证
    isAuthenticated(): boolean {
        return !!this.getStore().userInfo;
    }
}

export const authService = new AuthService();