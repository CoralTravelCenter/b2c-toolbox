import dayjs from "dayjs";

export default class Excursion {

    locationId;
    originalName;
    name;
    days;
    nights;
    parent;

    _scanRange = [];
    get scanRange() {
        return this._scanRange;
    }

    set scanRange([start_date, end_date]) {
        this._scanRange = [dayjs(start_date), dayjs(end_date).endOf('day')];
    }

    get datesSequence() {
        const _this = this;
        return [...(function* () {
            const [since, until] = _this.scanRange;
            let run = dayjs(since);
            while (run.isBefore(until)) {
                yield run.startOf('day');
                run = run.add(1, 'day');
            }
        })()];
    }

    constructor(location) {
        if (location.type === 7) {
            const [, days, nights, name] = location.name.match(/^\s*(\d+).+?\/\s*(\d+)\s*\S+\s+(.+)/);
            if (days && nights && name) {
                this.locationId = location.id;
                this.originalName = location.name;
                this.name = name;
                this.days = Number(days);
                this.nights = Number(nights);
                this.parent = location.parent;
                return this;
            }
        }
        throw 'parse failed';
    }
};