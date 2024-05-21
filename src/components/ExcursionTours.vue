<script setup>

import { computed, inject, reactive, ref, watchEffect } from "vue";
import { consultApi } from "../lib/b2c-api-adapter";
import { groupBy } from "lodash";
import { Checked, CopyDocument } from '@element-plus/icons-vue';
import Excursion from "./excursion";
import dayjs from "dayjs";
import locale_ru from 'dayjs/locale/ru'
import OffersMonthCalendar from "./OffersMonthCalendar.vue";
import { useClipboard } from "@vueuse/core";
dayjs.locale(locale_ru);


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
const excursionOffers = computed(() => excursions.map(e => e.offers).flat());
const excursionOffersMonths = computed(() => {
    const uniq = new Set(Object.keys(groupBy(excursionOffers.value, offer => offer.date.format('YYYY-MM'))));
    return [...uniq].sort();
});

function addSelectedExcursion() {
    excursions.push(selectedExcursion.value);
    selectedExcursion.value.scanRange = dateRangeToScan.value;
    selectedExcursion.value = null;
}

function disableBeforeTodayOrAfterHalfAYear(date) {
    const d = dayjs(date);
    const today = dayjs().endOf('day');
    const halfAYear = today.add(6, 'month').endOf('month');
    return d.isBefore(today) || d.isAfter(halfAYear);
}

const okToCopyMarkup = computed(() => {
    const excursions_ok = excursions.filter(e => e.scanStatus !== 'warning');
    return excursions_ok.length && excursions_ok.every(e => e.scanStatus === 'success');
});

const { copy: copy2clipboard } = useClipboard();

function copyMarkup() {
    copy2clipboard(JSON.stringify(excursions.filter(e => !!e.offers.length)));
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
                               :key="excursion.locationId"
                               :disabled="excursions.includes(excursion)">{{ excursion.originalName }}</el-option>
                </el-option-group>
            </el-select>
            <el-date-picker v-model="dateRangeToScan"
                            :teleported="false"
                            type="daterange" :disabled-date="disableBeforeTodayOrAfterHalfAYear"
                            unlink-panels></el-date-picker>

            <el-button type="success"
                       :disabled="!okToAdd" :plain="!okToAdd"
                       :icon="Checked" @click="addSelectedExcursion">Добавить</el-button>
        </div>

        <el-table :data="excursions" table-layout="auto">
            <el-table-column width="1%">
                <template #default="{ row: excursion }">
                    <el-progress type="circle" :width="64" :stroke-width="4"
                                 :percentage="excursion.scanCompletePercent"
                                 :status="excursion.scanStatus"></el-progress>
                </template>
            </el-table-column>
            <el-table-column label="Наименование" prop="name"></el-table-column>
            <el-table-column label="Ночей" prop="nights" align="center" header-align="center"></el-table-column>

            <el-table-column v-for="month in excursionOffersMonths" header-align="center" align="center">
                <template #header>{{ dayjs(month).format('MMMM') }}</template>
                <template #default="{ row: excursion }">
                    <OffersMonthCalendar :month="month" :offers="excursion.getOffersInMonth(month)"/>
                </template>
            </el-table-column>

        </el-table>

        <div class="controls">
            <el-button type="success" :icon="CopyDocument"
                       :plain="!okToCopyMarkup" :disabled="!okToCopyMarkup"
                       @click="copyMarkup">Копировать CMS компонент</el-button>
        </div>

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
    :deep(.el-table) {
        .el-progress {
            .el-progress__text {
                font-size: 12px!important;
                .el-icon {
                    width: 2em;
                    height: 2em;
                    > svg {
                        width: 2em;
                        height: 2em;
                    }
                }
            }
        }
    }
    .controls {
        display: flex;
        gap: 1.5em;
        justify-content: center;
    }
}
</style>