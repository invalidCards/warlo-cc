var timer = 0;
var timerCancelId = 0;
var steps = 0;

const timerElement = document.getElementById('time_left');
const timerControl = document.getElementById('timer_control');
const stepList = document.getElementById('steplist');
const stepsElement = document.getElementById('steps_out');
const fromElement = document.getElementById('from');
const toElement = document.getElementById('to');
const errorElement = document.getElementById('error-message');
const loadingElement = document.getElementById('loading-indicator');
const TIMER_LOW_CLASS = 'timerLow';
const HIDE_CLASS = 'elemHidden';

// Fetch options with User-Agent
const fetchOptions = {
    /*
    headers: {
        'User-Agent': 'WikiLink-Game/1.0 (github.com/warlo-cc) (Discord: @invalidCards)'
    }
    */
};

// Helper functions
const showError = (message) => {
    errorElement.innerText = message;
    errorElement.classList.remove(HIDE_CLASS);
};

const hideError = () => {
    errorElement.classList.add(HIDE_CLASS);
};

const showLoading = () => {
    loadingElement.classList.remove(HIDE_CLASS);
};

const hideLoading = () => {
    loadingElement.classList.add(HIDE_CLASS);
};

const extractLinksFromHTML = (htmlText, visitedPages = []) => {
    // Now create a container and parse the decoded HTML
    const container = document.createElement('div');
    container.innerHTML = htmlText;
    
    // Remove infobox and navbox tables (navigation/metadata)
    container.querySelectorAll('table.rsw-infobox, table.navbox, span.update-list').forEach(elem => {
        elem.remove();
    });
    
    // Get all links and filter them
    const links = [];
    const anchors = container.querySelectorAll('a[href]');
    const visitedSet = new Set(visitedPages);
    
    anchors.forEach(a => {
        const href = a.getAttribute('href');
        if (!href) return;
        
        let pageTitle = null;
        
        // Skip links with query parameters
        if (href.includes('?')) return;
        
        // Handle /w/Page_Title format (remove anchors if present)
        if (href.startsWith('/w/')) {
            let path = href.substring(3); // Remove '/w/'
            // Remove anchor/fragment if present
            const anchorIndex = path.indexOf('#');
            if (anchorIndex !== -1) {
                path = path.substring(0, anchorIndex);
            }
            pageTitle = decodeURIComponent(path);
        }
        // Skip external links or other formats
        else {
            return;
        }
        
        // Validate we have a page title
        if (!pageTitle) return;

        // Filter out year pages
        if (/^\d{1,4}$/.test(pageTitle)) {
            return;
        }

        // Filter out date pages (e.g. 18 April, 19 June, etc.)
        // Focus specifically on month names so that other pages starting with numbers (like "2007scape") are not excluded
        if (/^\d{1,2}_(January|February|March|April|May|June|July|August|September|October|November|December)$/.test(pageTitle)) {
            return;
        }
        
        // Filter out links with colons (categories, templates, user pages, etc.)
        if (!pageTitle.includes(':')) {
            // Skip if already visited
            if (!visitedSet.has(pageTitle)) {
                links.push(pageTitle);
            }
        }
    });
    
    // Remove duplicates and return
    return [...new Set(links)];
};

const validateInputs = () => {
    const wiki = document.querySelector('input[name="wiki_pick"]:checked')?.value;
    const stepsInput = parseInt(document.querySelector('input[name="steps"]').value);
    const timeInput = parseInt(document.querySelector('input[name="time_sec"]').value);

    if (!wiki) {
        showError('Please select a wiki.');
        return null;
    }
    if (isNaN(stepsInput) || stepsInput < 1 || stepsInput > 50) {
        showError('Steps must be between 1 and 50.');
        return null;
    }
    if (isNaN(timeInput) || timeInput < 1 || timeInput > 3600) {
        showError('Time must be between 1 and 3600 seconds.');
        return null;
    }

    return { wiki, steps: stepsInput, time: timeInput };
};

const wikiMap = {
    "RS3": "",
    "OSRS": "oldschool",
    "Classic": "classic"
}

document.getElementById('generate').onclick = async () => {
    hideError();
    const inputs = validateInputs();
    
    if (!inputs) {
        return;
    }

    showLoading();
    document.getElementById('generate').disabled = true;

    try {
        await buildPath(inputs.wiki, inputs.steps);
        
        timer = inputs.time;
        steps = inputs.steps;
        
        timerElement.innerText = timer.toString();
        if (timerElement.classList.contains(TIMER_LOW_CLASS)) {
            timerElement.classList.remove(TIMER_LOW_CLASS);
        }
        timerControl.innerText = 'Start';
        timerControl.disabled = false;

        if (document.querySelector('input[name="hide_path"]').checked) {
            stepList.classList.add(HIDE_CLASS);
        } else {
            if (stepList.classList.contains(HIDE_CLASS)) {
                stepList.classList.remove(HIDE_CLASS);
            }
        }

        stepsElement.innerText = steps;
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
        document.getElementById('generate').disabled = false;
    }
}

timerControl.onclick = () => {
    if (timer <= 0) {
        return;
    }

    if (timerCancelId !== 0) {
        clearInterval(timerCancelId);
        timerControl.innerText = 'Start';
        timerCancelId = 0;
    } else {
        timerControl.innerText = 'Stop';
        timerCancelId = setInterval(decreaseTimer, 1000)
    }
}

const decreaseTimer = () => {
    timer -= 1;
    timerElement.innerText = timer.toString();
    
    if (timer < 20 && !timerElement.classList.contains(TIMER_LOW_CLASS)) {
        timerElement.classList.add(TIMER_LOW_CLASS);
    }
    
    if (timer <= 0) {
        timer = 0;
        timerElement.innerText = '0';
        clearInterval(timerCancelId);
        timerCancelId = 0;
        timerControl.innerText = 'Time\'s up!';
        timerControl.disabled = true;
    }
}

const buildPath = async (wiki, steps) => {
    var hostname = 'runescape.wiki'
    var subdom = wikiMap[wiki];
    if (subdom !== undefined && subdom !== '') {
        hostname = `${subdom}.runescape.wiki`;
    }

    try {
        // Get random starting page
        const randomStartResp = await fetch(`https://${hostname}/api.php?action=query&format=json&list=random&rnlimit=1&rnnamespace=0`, fetchOptions);
        if (!randomStartResp.ok) {
            throw new Error(`Wiki server error: ${randomStartResp.status}`);
        }
        const randomStartData = await randomStartResp.json();
        
        if (!randomStartData.query?.random?.[0]?.title) {
            throw new Error('Failed to fetch starting page from wiki.');
        }
        
        const randomStart = randomStartData.query.random[0].title;
        var stepPageList = [];
        var currStepPage = randomStart;

        // Build path with retry logic
        for (var i = 0; i <= steps; i++) {
            let pageFound = false;
            let retries = 0;
            const maxRetries = 3;

            while (!pageFound && retries < maxRetries) {
                try {
                    // Fetch page HTML using parse action
                    const pageResp = await fetch(`https://${hostname}/api.php?action=parse&page=${encodeURIComponent(currStepPage)}&prop=text&format=json`, fetchOptions);
                    
                    if (!pageResp.ok) {
                        throw new Error(`Wiki server error: ${pageResp.status}`);
                    }
                    
                    const pageData = await pageResp.json();
                    
                    if (!pageData.parse?.text['*']) {
                        throw new Error('Failed to parse page.');
                    }

                    // Extract valid links from HTML, filtering infoboxes, navboxes, and special pages
                    // Also exclude any pages already visited in this path
                    const pageLinks = extractLinksFromHTML(pageData.parse.text['*'], stepPageList);
                    
                    if (pageLinks.length === 0) {
                        if (i === 0) {
                            throw new Error(`Starting page ${currStepPage} has no valid links. Try again.`);
                        }
                        // If not first step, try to get a new random page instead
                        const newPageResp = await fetch(`https://${hostname}/api.php?action=query&format=json&list=random&rnlimit=1&rnnamespace=0`, fetchOptions);
                        const newPageData = await newPageResp.json();
                        currStepPage = newPageData.query.random[0].title;
                        retries++;
                        continue;
                    }

                    const stepPage = pageLinks[Math.floor(Math.random() * pageLinks.length)];
                    stepPageList.push(stepPage);
                    currStepPage = stepPage;
                    pageFound = true;

                } catch (error) {
                    retries++;
                    if (retries >= maxRetries) {
                        throw new Error('Failed to generate path: ' + error.message);
                    }
                }
            }

            if (!pageFound) {
                throw new Error('Failed to generate complete path after multiple retries.');
            }
        }

        // Update UI with path
        stepList.innerHTML = stepPageList.map((x) => `<a href="https://${hostname}/w/${encodeURIComponent(x)}" target="_blank">${x.replace(/_/g, ' ')}</a>`).join(' > ');
        fromElement.innerHTML = `<a href="https://${hostname}/w/${encodeURIComponent(stepPageList.at(0))}" target="_blank">${stepPageList.at(0).replace(/_/g, ' ')}</a>`;
        toElement.innerHTML = `<a href="https://${hostname}/w/${encodeURIComponent(stepPageList.at(-1))}" target="_blank">${stepPageList.at(-1).replace(/_/g, ' ')}</a>`;

    } catch (error) {
        throw new Error(error.message || 'Unknown error generating path. Please try again.');
    }
}