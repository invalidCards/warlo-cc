window.onload = () => {
    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
            ev.preventDefault();
        }
    });
    var input = document.querySelector('#formula');
    if (input.dataset.placeholder !== '' && input.innerHTML === '') {
        input.innerHTML = input.dataset.placeholder;
        input.classList.add('placeholder');
        input.addEventListener('focusin', (event) => {
            if (event.target.classList.contains('placeholder')) {
                event.target.innerHTML = '';
                event.target.classList.remove('placeholder');
                event.target.focus();
            }
        });
        input.addEventListener('focusout', (event) => {
            if (event.target.innerHTML === '') {
                event.target.innerHTML = event.target.dataset.placeholder;
                event.target.classList.add('placeholder');
            }
        });
        input.addEventListener('input', () => {
            calculate();
        });
    }

    var dateform = document.querySelector('#refdate input[type="date"]');
    dateform.value = (new Date()).toISOString().substr(0, 10);
    dateform.addEventListener('input', () => {
        calculate();
    });
}

function calculate() {
    var referenceDate = new Date(document.querySelector('#refdate input[type="date"').value);
    var dateFormula = document.querySelector('#formula').innerHTML;
    var resultElement = document.querySelector('#result');

    if (isNaN(referenceDate.getTime())) {
        resultElement.innerHTML = 'Invalid reference date';
        return;
    }

    if (!dateFormula) {
        resultElement.innerHTML = 'Invalid date formula';
        return;
    }

    if (!dateFormula.startsWith('+') && !dateFormula.startsWith('-')) {
        dateFormula = '+' + dateFormula;
    }

    var matches = dateFormula.match(/[+-]?((C|\d+)(D|W|M|Q|Y)|WD\d+)/gi);
    if (matches == null || matches.filter(match => match.includes('C') && (match.match(/\d/g) != null)).length > 0) {
        resultElement.innerHTML = 'Invalid date formula';
        return;
    }

    var workingDate = luxon.DateTime.fromJSDate(referenceDate);
    for (var i = 0; i < matches.length; i++) {
        var match = matches[i];
        var current = match.match(/C/gi) != null;
        var quantity = match.match(/\d+/g);
        if (quantity == null) {
            quantity = 0;
        } else {
            quantity = parseInt(quantity[0]);
        }
        var unit = match.match(/WD/gi);
        if (unit == null) {
            unit = match.match(/(D|W|M|Q|Y)/gi);
            if (unit == null) {
                unit = '';
            } else {
                unit = unit[0].toUpperCase();
            }
        } else {
            unit = unit[0].toUpperCase();
        }
        var positive = match.startsWith('+');

        if (!unit) {
            resultElement.innerHTML = 'Invalid date formula';
            return;
        }

        if (unit === 'WD' && quantity !== 0) {
            while (true) {
                workingDate = positive ? workingDate.plus({days: 1}) : workingDate.minus({days: 1});
                if (workingDate.weekday === quantity) {
                    break;
                }
            }
        } else if (current) {
            if (positive) {
                switch (unit) {
                    case 'W': workingDate = workingDate.endOf('week'); break;
                    case 'M': workingDate = workingDate.endOf('month'); break;
                    case 'Q': workingDate = workingDate.endOf('quarter'); break;
                    case 'Y': workingDate = workingDate.endOf('year'); break;
                }
            } else {
                switch (unit) {
                    case 'W': workingDate = workingDate.startOf('week'); break;
                    case 'M': workingDate = workingDate.startOf('month'); break;
                    case 'Q': workingDate = workingDate.startOf('quarter'); break;
                    case 'Y': workingDate = workingDate.startOf('year'); break;
                }
            }
        } else {
            if (positive) {
                switch (unit) {
                    case 'D': workingDate = workingDate.plus({days: quantity}); break;
                    case 'W': workingDate = workingDate.plus({weeks: quantity}); break;
                    case 'M': workingDate = workingDate.plus({months: quantity}); break;
                    case 'Q': workingDate = workingDate.plus({quarters: quantity}); break;
                    case 'Y': workingDate = workingDate.plus({years: quantity}); break;
                }
            } else {
                switch (unit) {
                    case 'D': workingDate = workingDate.minus({days: quantity}); break;
                    case 'W': workingDate = workingDate.minus({weeks: quantity}); break;
                    case 'M': workingDate = workingDate.minus({months: quantity}); break;
                    case 'Q': workingDate = workingDate.minus({quarters: quantity}); break;
                    case 'Y': workingDate = workingDate.minus({years: quantity}); break;
                }
            }
        }
    }

    resultElement.innerHTML = workingDate.toLocaleString();
}
