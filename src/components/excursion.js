import dayjs from "dayjs";
import { hotelCommonSearchCriterias } from "../config/globals";
import { consultApi } from "../lib/b2c-api-adapter";

export default class Excursion {

    locationId;
    locationType;
    originalName;
    name;
    days;
    nights;
    parent;

    offers = [];
    _failed = false;

    _scanRange = [];
    get scanRange() {
        return this._scanRange;
    }

    _queriesCompleteCount = 0;
    get scanCompletePercent() {
        const days2scan = this.datesSequence.length;
        return Math.round(days2scan ? this._queriesCompleteCount / days2scan * 100 : 0);
    }

    set scanRange([start_date, end_date]) {
        this._scanRange = [dayjs(start_date), dayjs(end_date).endOf('day')];
        try {
            this.scan();
        } catch (ex) {
            this._failed = true;
        }
    }

    get scanStatus() {
        if (this._failed) {
            return 'exception';
        } else {
            return this.scanCompletePercent === 100 ? (!!this.offers.length ? 'success' : 'warning') : '';
        }
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

    get queryParamsSequence() {
        return this.datesSequence.map(djs => {
            const searchCriteria = Object.assign({}, hotelCommonSearchCriterias, {
                beginDates: [djs.format('YYYY-MM-DD')],
                nights: [{ value: this.nights }],
                arrivalLocations: [{ id: this.locationId, type: this.locationType }]
            });
            return { searchCriterias: searchCriteria };
        });
    }

    constructor(location) {
        if (location.type === 7) {
            const [, days, nights, name] = location.name.match(/^\s*(\d+).+?\/\s*(\d+)\s*\S+\s+(.+)/);
            if (days && nights && name) {
                this.locationId = location.id;
                this.locationType = location.type;
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

    getOffersInMonth(month) {
        const m = dayjs(month);
        return this.offers.filter(offer => m.isSame(offer.date, 'month'));
    }

    async scan() {
        for (let queryParams of this.queryParamsSequence) {
            const api_result = await consultApi('/OnlyHotelProduct/PriceSearchList', 'post', queryParams);
            this._queriesCompleteCount++;
            const offer = api_result.result?.products?.at(0)?.offers?.at(0);
            if (offer) {
                console.log('+++ offer: %o', offer);
                this.offers.push({
                    date: dayjs(offer.checkInDate),
                    price: offer.price.amount,
                    link: offer.link
                });
            }
        }
    }

};