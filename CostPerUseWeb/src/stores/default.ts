import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useDefaultStore = defineStore('store', () => {
    const defaultRoute = ref("/note");
    return { defaultRoute, }
})