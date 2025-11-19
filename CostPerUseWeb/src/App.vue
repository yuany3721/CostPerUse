<script setup lang="ts">
// import { RouterView } from 'vue-router'
import AuthLoading from './components/AuthLoading.vue'
import { useAuthStore } from './stores/auth'
import { ref } from 'vue'
import Cookies from 'js-cookie'

import { useDefaultStore } from './stores/default'

import { authService } from './Auth'
const authStore = useAuthStore()

import axios from 'axios'
axios.defaults.withCredentials = true

const authorized = ref(false)

onMounted(async () => {
    const queryString = window.location.search.split('?')[1]
    if (queryString && queryString.includes('token=')) {
        const token = queryString.split('token=')[1]?.split('&')[0] ?? null
        Cookies.set('token', token || '', { expires: 7 })
        // console.log('从URL获取token:', token);
        window.location.href = window.location.href.split('?')[0] ?? window.location.href
    }

    if (authStore.token) {
        // console.log('已有token:', authStore.token);
        await setTimeout(() => {
            // authStore.setToken(authStore.token);
        }, 1000)
        const valid = await authService.validateAuth()
        if (valid && authStore.userInfo.groups.includes('Home')) {
            // console.log('token有效');
            authorized.value = true
        } else {
            // console.log('token无效');
            authorized.value = false
        }
    } else {
        // console.log('无token');
        authorized.value = false
    }

    if (!authorized.value) {
        try {
            await authService.startLogin(window.location.href)
        } catch (error) {
            console.error('login err:', error)
        }
    }
})
const activeIndex = ref(useDefaultStore().defaultRoute)
const handleSelect = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}
</script>

<template>
    <el-container class="container" :style="{ boxShadow: `var(--el-box-shadow)` }">
        <AuthLoading v-if="!authorized" />

        <el-aside width="100px" v-if="authorized">
            <el-menu :default-active="activeIndex" @select="handleSelect" :router="true">
                <!-- <el-menu-item index="/">Home</el-menu-item> -->
                <el-menu-item index="/note">note</el-menu-item>
                <el-menu-item index="/cost">cost</el-menu-item>
            </el-menu>
        </el-aside>

        <el-main v-if="authorized">
            <router-view />
        </el-main>
    </el-container>
</template>

<style scoped>
.container {
    height: 100vh;
    width: 100vw;
}

.el-header {
    position: relative;
}

.el-aside {
    border-right: 1px solid #eee;
}

.el-menu {
    border-right: none;
}
</style>
