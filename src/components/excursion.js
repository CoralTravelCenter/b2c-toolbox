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
    bestOffer;

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
            let [, days, nights, name] = location.name.match(/^\s*(\d+).+?\/\s*(\d+)\s*\S+\s+(.+)/) ?? [];
            if (!(days && nights && name)) {
                [name, days] = location.name.match(/(\d+)\s+((день)|(дня)|(дней))/ui) ?? [];
                if (name && days) {
                    name = location.name;
                    nights = days - 1;
                }
            }
            if (!(days && nights && name)) {
                [name, nights] = location.name.match(/(\d+)\s+((ночь)|(ночи)|(ночей))/ui) ?? [];
                if (name && nights) {
                    name = location.name;
                    days = nights + 1;
                }
            }
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
            const result = api_result.result;
            const product = result?.products?.at(0);
            const offer = product?.offers?.at(0);
            if (offer) {
                // console.log('+++ offer: %o', offer);
                const date_djs = dayjs(offer.checkInDate);
                date_djs.toJSON = (function (){ return this.format('YYYY-MM-DD') }).bind(date_djs);
                const offer_data = {
                    date: date_djs,
                    price: offer.price.amount,
                    link: offer.link
                };
                if (!this.bestOffer || offer_data.price < this.bestOffer.price) {
                    this.bestOffer = {
                        price: offer_data.price,
                        installment: offer.installmentCredit?.monthlyPrice?.amount,
                        room: result.rooms[offer.rooms[0].roomKey].name,
                        meal: result.meals[offer.rooms[0].mealKey].name,
                        visual: product.hotel.images?.at(0)?.sizes?.at(0)?.url
                    };
                }
                this.offers.push(offer_data);
            }
        }
    }

};