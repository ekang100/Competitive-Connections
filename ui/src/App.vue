<template>
  <div>
    <b-navbar toggleable="lg" type="dark" :variant="user?.roles?.includes('operator') ? 'info' : 'primary'">
      <b-navbar-brand href="#">
        <span v-if="user?.username">Howdy, {{ mockUser.username }}</span>
        <span v-else>Competitive Connections</span>
      </b-navbar-brand>
      <b-navbar-nav>
        <b-nav-item v-if="user?.username == null" href="/api/login">Login</b-nav-item>
        <b-nav-item v-if="user?.roles?.includes('admin')" href="/admin">Admin</b-nav-item>
        <b-nav-item v-if="user?.username" @click="logout">Logout</b-nav-item>
        <form method="POST" action="/api/logout" id="logoutForm" />
      </b-navbar-nav>
    </b-navbar>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, provide } from 'vue'
import { mockUser } from "./mockUser"

const user = ref(mockUser)


function logout() {
  ;(window.document.getElementById('logoutForm') as HTMLFormElement).submit()  
}
</script>