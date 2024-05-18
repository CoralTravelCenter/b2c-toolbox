<script setup>

import { computed, inject, ref, watchEffect } from "vue";
import { consultApi } from "../lib/b2c-api-adapter";
import { groupBy } from "lodash";

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

function parseExcursionFromLocation(location) {
    if (location.type === 7) {
        const [, days, nights, name] = location.name.match(/^\s*(\d+).+?\/\s*(\d+)\s*\S+\s+(.+)/);
        if (days && nights && name) {
            return {
                locationId: location.id,
                originalName: location.name,
                name,
                days: Number(days),
                nights: Number(nights),
                parent: location.parent
            }
        }
    }
    throw 'parse failed';
}

const groupedExcursionList = computed(() => {
    const excursions = [...(function* (list) {
        for (let location of list) {
            try {
                yield parseExcursionFromLocation(location);
            } catch (ex) {}
        }
    })(backendLocationList.value)];
    return groupBy(excursions, ex => ex.parent?.id);
});

</script>

<template>
    <div class="excursion-tours">
        <el-select v-model="selectedExcursion"
                   placeholder="Наименование тура"
                   :teleported="false"
                   :loading="isExcursionListQueryInProgress"
                   loading-text="Ищем..."
                   filterable clearable
                   remote :remote-method="(query) => excursionListQueryKeywords = query">
            <template #empty>
                <span>Ничего похожего не нашлось ;(</span>
            </template>
            <el-option-group v-for="(group, group_parent_id) in groupedExcursionList"
                             :label="group[0].parent.name" :key="group_parent_id">
                <el-option v-for="excursion in group" :key="excursion.locationId">{{ excursion.name }}</el-option>
            </el-option-group>
        </el-select>
    </div>
</template>

<style scoped lang="less">
.excursion-tours {
    padding: 2em 0;
}
</style>