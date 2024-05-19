<script setup>

import { computed, inject, reactive, ref, watchEffect } from "vue";
import { consultApi } from "../lib/b2c-api-adapter";
import { groupBy } from "lodash";
import { Checked } from '@element-plus/icons-vue';
import Excursion from "./excursion";
import dayjs from "dayjs";

const { activeToolTitle } = inject('active-tool');

activeToolTitle.value = 'Экскурсионные туры';

const selectedExcursion = ref();

const excursionListQueryKeywords = ref('');
const isExcursionListQueryInProgress = ref(false);

const backendLocationList = ref([]);

watchEffect(() => {
    if (excursionListQueryKeywords.value.length >= 3) {
        isExcursionListQueryInProgress.value = true;
        consultApi('/OnlyHotelProduct/ListArrivalLocations', 'post', {
            text: excursionListQueryKeywords.value
        }).then((result_json) => {
            console.log('+++ excursionListQueryKeywords: result: %o', result_json);
            isExcursionListQueryInProgress.value = false;
            backendLocationList.value = result_json.result.locations;
        });
    }
});

const groupedExcursionList = computed(() => {
    const excursions = [...(function* (list) {
        for (let location of list) {
            try {
                yield new Excursion(location);
            } catch (ex) {}
        }
    })(backendLocationList.value)];
    return groupBy(excursions, ex => ex.parent?.id);
});

const dateRangeToScan = ref();

const okToAdd = computed(() => {
    return !!selectedExcursion.value && dateRangeToScan.value?.every(date => !!date);
});

const excursions = reactive([]);

function addSelectedExcursion() {
    excursions.push(selectedExcursion.value);
    selectedExcursion.value.scanRange = dateRangeToScan.value;
}

</script>

<template>
    <div class="excursion-tours">
        <div class="finder-ctl">
            <el-select v-model="selectedExcursion"
                       value-key="locationId"
                       placeholder="Наименование тура"
                       :teleported="false"
                       :loading="isExcursionListQueryInProgress"
                       loading-text="Ищем..."
                       filterable clearable remote-show-suffix
                       remote :remote-method="(query) => excursionListQueryKeywords = query">
                <template #empty>
                    <span>Ничего похожего не нашлось ;(</span>
                </template>
                <el-option-group v-for="(group, group_parent_id) in groupedExcursionList"
                                 :label="group[0].parent.name" :key="group_parent_id">
                    <el-option v-for="excursion in group"
                               :value="excursion"
                               :label="excursion.originalName"
                               :key="excursion.locationId">{{ excursion.originalName }}</el-option>
                </el-option-group>
            </el-select>
            <el-date-picker v-model="dateRangeToScan"
                            :teleported="false"
                            type="daterange" :disabled-date="(d) => dayjs(d).isBefore(dayjs().endOf('day'))"
                            unlink-panels></el-date-picker>

            <el-button type="success"
                       :disabled="!okToAdd" :plain="!okToAdd"
                       :icon="Checked" @click="addSelectedExcursion">Добавить</el-button>
        </div>

        <el-table :data="excursions">
            <el-table-column width="40"></el-table-column>
            <el-table-column label="Наименование" prop="name"></el-table-column>
            <el-table-column label="Ночей" prop="nights" align="center" header-align="center"></el-table-column>
        </el-table>

    </div>
</template>

<style scoped lang="less">
.excursion-tours {
    padding: 2em 0;
    display: flex;
    flex-direction: column;
    gap: 2em;
    .finder-ctl {
        display: flex;
        gap: 2em;
    }
    .el-table {

    }
}
</style>