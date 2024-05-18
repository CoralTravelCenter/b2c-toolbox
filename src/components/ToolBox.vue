<script setup>

import { computed, provide, ref, shallowRef } from 'vue';
import { useDark } from "@vueuse/core";
import { Sunny, Moon, HomeFilled } from '@element-plus/icons-vue';
import DashBoard from "./DashBoard.vue";

const isDark = useDark();
const activeTool = shallowRef(DashBoard);
const activeToolTitle = ref();
provide('active-tool', { activeTool, activeToolTitle });

const atHome = computed(() => activeTool.value === DashBoard);

function goHome() {
    activeTool.value = DashBoard;
    activeToolTitle.value = null;
}

</script>

<template>
    <div class="tool-box">
        <el-page-header class="main-layout" :class="{ 'at-home': atHome }" :icon="HomeFilled" @back="goHome">
            <template #content>{{ activeToolTitle || 'B2C Toolbox' }}</template>
            <template #extra>
                <el-switch v-model="isDark" :active-action-icon="Moon" :inactive-action-icon="Sunny"></el-switch>
            </template>
            <Component :is="activeTool"/>
        </el-page-header>
    </div>
</template>

<style scoped  lang="less">
.tool-box {
    position: fixed;
    z-index: 99999;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    background-color: var(--el-bg-color-page);
    padding: 2em;
    box-sizing: border-box;
    * {
        box-sizing: border-box;
    }
}

.main-layout {
    height: 100%;
    display: grid;
    grid-template-rows: auto 1fr;
    &.at-home {
        :deep(.el-page-header__left :not(.el-page-header__content)) {
            display: none;
        }
    }
    :deep(.el-page-header__title) {
        display: none;
    }
    :deep(.el-page-header__icon) {
        margin-right: 0;
    }
}


</style>