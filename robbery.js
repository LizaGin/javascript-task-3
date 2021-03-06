'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */

const MINUTES_IN_HOURS = 60;
const MAX_MINUTE = 4320;

const DAYS = {
    'ПН': 0,
    'ВТ': 24,
    'СР': 48
};

function getAppropriateMoment(schedule, duration, workingHours) {
    const bankTimeZone = getTimezone(workingHours.from);
    const bankSchedule = getBankSchedule(getBankScheduleInDatestamp(workingHours));
    const robberSchedule = getRobberSchedule(schedule, bankTimeZone);
    let timeRangesToRobbery = getTimeToRobbery (robberSchedule, bankSchedule, duration);
    timeRangesToRobbery = timeRangesToRobbery.sort((a, b) => a.from - b.from);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return timeRangesToRobbery.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (timeRangesToRobbery.length === 0) {
                return '';
            }

            const start = timeRangesToRobbery[0].from;
            const [day, hours, minutes] = minutesToDatestamp(start);

            return template
                .replace('%DD', day)
                .replace('%HH', hours)
                .replace('%MM', minutes);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!this.exists()) {
                return false;
            }
            const current = timeRangesToRobbery[0];
            if (current.to - current.from - 30 >= duration) {
                current.from = current.from + 30;

                return true;
            }

            if (timeRangesToRobbery.length === 1) {
                return false;
            }
            timeRangesToRobbery.shift();

            return true;
        }
    };
}

function getTimezone(datestamp) {
    return parseInt(datestamp.match(/\+\d{1,2}/)[0].substring(1));
}

function getDays(datestamp) {
    return datestamp.substring(0, 2);
}

function getHours(datestamp) {
    return parseInt(datestamp.substring(3, 5));
}

function getMinutes(datestamp) {
    return parseInt(datestamp.substring(6, 8));
}

function datestampToMinutes(datestamp) {
    return (DAYS[getDays(datestamp)] + getHours(datestamp)) *
     MINUTES_IN_HOURS + getMinutes(datestamp);
}

function minutesToDatestamp(time) {
    const minutes = time % 60;
    const h = (time - minutes) / 60;
    const hours = h % 24;
    const hoursStr = (hours < 10)
        ? '0' + hours.toString() : hours;
    const days = h - hours;
    const day = getKeyByValue(DAYS, days);
    const minutesStr = (minutes < 10)
        ? '0' + minutes.toString() : minutes;

    return [day, hoursStr, minutesStr];
}

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function robberDatestampToMinutes(bankTimeZone, robberDatestamp) {
    const robberTimeZone = getTimezone(robberDatestamp);
    const diff = bankTimeZone - robberTimeZone;

    return datestampToMinutes(robberDatestamp) + diff * 60;
}

function getBankScheduleInDatestamp(workingHours) {
    const schedule = [];
    Object.keys(DAYS).forEach(day => {
        const daySchedule = { 'from': day + ' ' + workingHours.from,
            'to': day + ' ' + workingHours.to };
        schedule.push(daySchedule);
    });

    return schedule;
}

function getBankSchedule(schedule) {
    const minutesSchedule = [];

    schedule.forEach(timeRange => {
        const from = datestampToMinutes(timeRange.from);
        const to = datestampToMinutes(timeRange.to);
        minutesSchedule.push({ 'from': from, 'to': to });
    });

    return minutesSchedule;
}

function getRobberSchedule(schedule, bankTimeZone) {
    const minutesSchedule = {};
    Object.keys(schedule).forEach(robberName => {
        const robberSchedule = [];
        schedule[robberName].forEach(timeRange => {
            robberSchedule.push({
                from: robberDatestampToMinutes(bankTimeZone, timeRange.from),
                to: robberDatestampToMinutes(bankTimeZone, timeRange.to)
            });
        });
        minutesSchedule[robberName] = getFreeTime(robberSchedule);
    });

    return minutesSchedule;
}

function getFreeTime(robberSchedule) {
    const freeTimeSchedule = [];
    let start = 0;
    robberSchedule.forEach(range => {
        if (start < range.from) {
            freeTimeSchedule.push({ from: start, to: range.from });
        }
        start = range.to;
    });
    if (start < MAX_MINUTE) {
        freeTimeSchedule.push({ from: start, to: MAX_MINUTE });
    }

    return freeTimeSchedule;
}

function isIntersected(left, right) {
    return !(left.from >= right.to || left.to <= right.from);
}

function getIntersection(left, right) {
    const intersected = [];
    left.forEach(l => {
        right.forEach(r => {
            if (isIntersected(l, r)) {
                intersected.push({
                    from: Math.max(l.from, r.from),
                    to: Math.min(l.to, r.to)
                });
            }
        });
    });

    return intersected;
}

function getTimeToRobbery(robberSchedule, bankSchedule, duration) {
    const twoRobbers = getIntersection(robberSchedule.Danny, robberSchedule.Linus);
    const threeRobbers = getIntersection(twoRobbers, robberSchedule.Rusty);
    const timeRangeToRobber = getIntersection(threeRobbers, bankSchedule);

    return timeRangeToRobber.filter(interval => (interval.to - interval.from >= duration) &&
     (interval.from < interval.to));
}

module.exports = {
    getAppropriateMoment,

    isStar
};
