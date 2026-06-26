<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="placeholder-view">
    <div class="placeholder-card">
      <div class="placeholder-icon">🚧</div>
      <h2 class="placeholder-title">{{ t('sidebar.marketplace') }}</h2>
      <p class="placeholder-text">{{ t('common.comingSoon') }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/styles/variables" as *;

.placeholder-view {
  height: calc(100 * var(--vh));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.placeholder-card {
  max-width: 420px;
  text-align: center;
  padding: 48px 32px;
  border-radius: $radius-lg;
  background: var(--bg-primary);
  border: 1px solid $border-color;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.placeholder-title {
  font-size: 20px;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 8px;
}

.placeholder-text {
  font-size: 14px;
  color: $text-muted;
  margin: 0;
}
</style>
