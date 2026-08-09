<template>
  <a-layout style="height: 100%; overflow: hidden">
    <AppTitleBar />

    <!-- 主内容 -->
    <a-layout style="
        display: flex;
        flex-direction: column;
        height: calc(-60px + 100vh);
        margin-top: 60px;
        min-height: 0px;
      ">
      <a-layout-content class="content" style="flex: 1 1 0%; min-height: 0px; overflow-y: auto">
        <div class="content-wrapper">
          <router-view />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import AppTitleBar from '../components/AppTitleBar.vue'
</script>

<style>
.content {
  padding: 15px;
  background: var(--theme-background);
  position: relative;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  min-height: 100%;
}
</style>
