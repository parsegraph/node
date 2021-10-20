import TestSuite from "parsegraph-testsuite";

export function datesEqual(a, b) {
  if (a == undefined || b == undefined) {
    return a == undefined && b == undefined;
  }
  return (
    a.getDate() == b.getDate() &&
    a.getMonth() == b.getMonth() &&
    a.getFullYear() == b.getFullYear()
  );
}

export function dateGreater(a, b) {
  if (a == undefined) {
    return false;
  }
  if (b == undefined) {
    return true;
  }

  if (a.getFullYear() <= b.getFullYear()) {
    if (a.getFullYear() !== b.getFullYear()) {
      // a.getFullYear() < b.getFullYear()
      return false;
    }
    // a.getFullYear() === b.getFullYear()
    if (a.getMonth() <= b.getMonth()) {
      if (a.getMonth() !== b.getMonth()) {
        // a.getMonth() < b.getMonth()
        return false;
      }
      // a.getMonth() === b.getMonth()
      return a.getDate() > b.getDate();
    }
    // a.getMonth() > b.getMonth()
    return true;
  }
  // a.getFullYear() > b.getFullYear()
  return true;
}

const dateTests = new TestSuite("Date");

dateTests.addTest("dateGreater", function () {
  if (dateGreater(new Date(2016, 0, 1), new Date(2017, 0, 1))) {
    return "2016 is showing as greater than 2017?!";
  }
  if (!dateGreater(new Date(2018, 0, 1), new Date(2017, 0, 1))) {
    return "2018 is showing as less than 2017?!";
  }
});

function getListOfDays() {
  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
}

function getListOfMonths() {
  return [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
}

const OFFSET = new Date().getTime();
export function getRuntimeInMillis() {
  return getTimeInMillis() - OFFSET;
}

export function getTimeInMillis() {
  return new Date().getTime();
}

export const TIMEOUT = 40000;

export function outputMonth(d, includeYear) {
  let str = parsegraph_getListOfMonths()[d.getMonth()];
  if (includeYear || includeYear === undefined) {
    str += " " + d.getFullYear();
  }
  return str;
}

export function outputDate(d, includeDate, includeTime, includeToday) {
  let timeString = "";
  if (includeDate || includeDate === undefined) {
    if (
      datesEqual(d, new Date()) &&
      (includeToday || includeToday === undefined)
    ) {
      timeString += "Today, ";
    }

    const dayOfWeek = getListOfDays();
    timeString += dayOfWeek[d.getDay()] + ", ";

    const months = getListOfMonths();
    timeString +=
      months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    if (includeTime || includeTime === undefined) {
      timeString += " at ";
    }
  }
  if (includeTime || includeTime === undefined) {
    const outputMinutes = function () {
      if (d.getMinutes() < 10) {
        return "0" + d.getMinutes();
      }
      return d.getMinutes().toString();
    };
    if (d.getHours() == 12) {
      timeString += d.getHours() + ":" + outputMinutes() + " PM";
    } else if (d.getHours() > 12) {
      timeString += d.getHours() - 12 + ":" + outputMinutes() + " PM";
    } else if (d.getHours() == 0) {
      timeString += "12:" + outputMinutes() + " AM";
    } else {
      timeString += d.getHours() + ":" + outputMinutes() + " AM";
    }
  }
  return timeString;
}

export function previousMonth(d) {
  d = new Date(d);
  if (d.getMonth() == 0) {
    d.setFullYear(d.getFullYear() - 1, 11, d.getDate());
  } else {
    d.setMonth(d.getMonth() - 1);
  }
  return d;
}

export function nextMonth(d) {
  d = new Date(d);
  if (d.getMonth() == 11) {
    d.setFullYear(d.getFullYear() + 1, 0, d.getDate());
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}

export function previousDay(d) {
  d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  d.setDate(d.getDate() - 1);
  return d;
}

export function nextDay(d) {
  d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  d.setDate(d.getDate() + 1);
  return d;
}

export function previousWeek(d) {
  d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  d.setDate(d.getDate() - 7);
  return d;
}

export function nextWeek(d) {
  d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  d.setDate(d.getDate() + 7);
  return d;
}

export function getFirstDayOfWeek(d) {
  while (d.getDay() != 0) {
    d = previousDay(d);
  }
  return d;
}

export function NormalizeTo360(n) {
  return n - Math.floor(n / 360.0) * 360;
}

const daysInMonths = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
export function monthToYearOffset(d) {
  return daysInMonths[d.getMonth()];
}
