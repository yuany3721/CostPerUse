import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import Cookies from 'js-cookie'

export const useAuthStore = defineStore('auth', () => {
    const userInfo = ref({ groups: [] as string[] });
    const token = ref(Cookies.get('token') || '');
    return { token, userInfo }
})