<script setup>

import toolsConfig from './tools-config'
import { Guide } from '@element-plus/icons-vue';
import { inject } from "vue";

const { activeTool } = inject('active-tool');

</script>

<template>
    <div class="dashboard">
        <el-card v-for="tool in toolsConfig" class="tool-card" @click="activeTool = tool.component">
            <template #header>
                <div class="tool-card-header">
                    <el-icon size="2em"><Guide /></el-icon>
                    <span class="title">{{ tool.title }}</span>
                </div>
            </template>
            <span>{{ tool.description }}</span>
        </el-card>
    </div>
</template>

<style scoped lang="less">
.dashboard {
    padding: 2em 0;
    display: flex;
    .tool-card {
        cursor: pointer;
    }
    .tool-card-header {
        display: flex;
        align-items: center;
        .el-icon {
            margin-right: .5em;
        }
        .title {
            font-weight: bold;
        }
    }
}
</style>