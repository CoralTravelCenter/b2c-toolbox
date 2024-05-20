<script setup>
import dayjs from "dayjs";
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { computed } from "vue";

dayjs.extend(isSameOrBefore);

const props = defineProps({
    month: {
        type: String
    },
    offers: {
        type:    Array,
        default: []
    }
});

const calendarRange = computed(() => {
    const month = dayjs(props.month);
    const startOfCal = month.startOf('week');
    const endOfCal = month.endOf('month').endOf('week');
    return [...(function* () {
        let run = dayjs(startOfCal);
        while (run.isSameOrBefore(endOfCal)) {
            yield run;
            run = run.add(1, 'day');
        }
    })()];

});

function offerByDay(day) {
    return props.offers.find(offer => offer.date.isSame(day, 'day'));
}

function offerHrefByDay(day) {
    const host = location.hostname === 'localhost' ? '//www.coral.ru' : '';
    const link = offerByDay(day).link;
    return `${ host }/hotels${ link.redirectionUrl }/?qp=${ link.queryParam }&p=2`;
}

</script>

<template>
    <div class="offers-month-calendar">
        <span class="week-day-label">пн</span>
        <span class="week-day-label">вт</span>
        <span class="week-day-label">ср</span>
        <span class="week-day-label">чт</span>
        <span class="week-day-label">пт</span>
        <span class="week-day-label">сб</span>
        <span class="week-day-label">вс</span>
        <template v-for="day in calendarRange">
            <a v-if="!!offerByDay(day)" :href="offerHrefByDay(day)" target="_blank">{{ day.format('D') }}</a>
            <span v-else class="day" :class="{
            weekend: [0,6].includes(day.day()),
            'other-month': !day.isSame(month, 'month')
        }">{{ day.format('D') }}</span>
        </template>
    </div>
</template>

<style scoped lang="less">
.offers-month-calendar {
    display: inline-grid;
    grid-template-columns: repeat(7, auto);
    gap: 3px;
    padding: 4px;
    font-size: 11px;
    line-height: 1;
    border: 1px solid var(--el-table-border-color);
    border-radius: 2px;
    .week-day-label {
        text-align: center;
        padding-bottom: 3px;
    }
    a[href] {
        padding: 2px;
        background-color: var(--el-color-success-light-5);
        color: var(--el-table-text-color);
        border-radius: 2px;
    }
    .day {
        padding: 2px;
        color: inherit;
        text-decoration: none;
        &.other-month {
            color: transparent;
            background: none!important;
        }
        &.weekend {
            background-color: var(--el-table-border-color);
        }
    }
}
</style>