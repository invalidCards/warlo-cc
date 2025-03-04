var timer = 0;
var timerCancelId = 0;
var steps = 0;

const timerElement = document.getElementById('time_left');
const timerControl = document.getElementById('timer_control');
const stepList = document.getElementById('steplist');
const stepsElement = document.getElementById('steps_out');
const fromElement = document.getElementById('from');
const toElement = document.getElementById('to');
const TIMER_LOW_CLASS = 'timerLow';
const HIDE_CLASS = 'elemHidden';

const wikiMap = {
    "RS3": "",
    "OSRS": "oldschool",
    "Classic": "classic"
}

document.getElementById('generate').onclick = async () => {
    var wiki = document.querySelector('input[name="wiki_pick"]:checked').value;
    steps = parseInt(document.querySelector('input[name="steps"]').value);
    timer = parseInt(document.querySelector('input[name="time_sec"]').value);

    if (wiki === '' || isNaN(steps) || isNaN(timer)) {
        return;
    }

    await buildPath(wiki, steps);
    
    timerElement.innerText = timer.toString();
    if (timerElement.classList.contains(TIMER_LOW_CLASS)) {
        timerElement.classList.remove(TIMER_LOW_CLASS);
    }
    timerControl.innerText = 'Start timer';

    if (document.querySelector('input[name="hide_path"]').checked) {
        stepList.classList.add(HIDE_CLASS);
    } else {
        if (stepList.classList.contains(HIDE_CLASS)) {
            stepList.classList.remove(HIDE_CLASS);
        }
    }

    stepsElement.innerText = steps;
}

timerControl.onclick = () => {
    if (timer === 0) {
        return;
    }

    if (timerCancelId !== 0) {
        clearInterval(timerCancelId);
        timerControl.innerText = 'Start timer';
        timerCancelId = 0;
    } else {
        timerControl.innerText = 'Stop timer';
        timerCancelId = setInterval(decreaseTimer, 1000)
    }
}

const decreaseTimer = () => {
    timer -= 1;
    timerElement.innerText = timer.toString();
    if (timer < 20 && !timerElement.classList.contains(TIMER_LOW_CLASS)) {
        timerElement.classList.add(TIMER_LOW_CLASS);
    }
    if (timer === 0) {
        clearInterval(timerCancelId);
        timerCancelId = 0;
    }
}

const buildPath = async (wiki, steps) => {
    var hostname = 'runescape.wiki'
    var subdom = wikiMap[wiki];
    if (subdom !== undefined && subdom !== '') {
        hostname = `${subdom}.runescape.wiki`;
    }

    const randomStart = (await (await fetch(`https://${hostname}/api.php?action=query&format=json&list=random&rnlimit=1&rnnamespace=0`)).json()).query.random[0].title;
    var stepPageList = [];
    var currStepPage = randomStart;
    for (var i = 0; i <= steps; i++) {
        var pageLinksResp = await (await fetch(`https://${hostname}/api.php?action=query&format=json&titles=${encodeURIComponent(currStepPage)}&prop=links&plnamespace=0&pllimit=max`)).json();
        var pageLinksPages = pageLinksResp.query.pages;
        var pageLinks = pageLinksPages[Object.keys(pageLinksPages)[0]].links;
        var stepPage = pageLinks[Math.floor(Math.random() * pageLinks.length)];
        stepPageList.push(stepPage.title);
        currStepPage = stepPage.title;
    }

    stepList.innerHTML = stepPageList.map((x) => `<a href="https://${hostname}/w/${encodeURIComponent(x)}">${x}</a>`).join(' > ');
    fromElement.innerText = stepPageList.at(0);
    toElement.innerText = stepPageList.at(-1);
}