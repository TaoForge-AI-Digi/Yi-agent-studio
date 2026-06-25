<template>
  <n-config-provider :theme="null">
    <n-message-provider>
      <div class="app-layout">
        <Sidebar />
        <ChatView />
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { NConfigProvider, NMessageProvider } from 'naive-ui';
import Sidebar from './components/Sidebar.vue';
import ChatView from './components/ChatView.vue';
</script>

<style scoped>
.app-layout { display: flex; height: 100vh; background: #ffffff; }
</style>
