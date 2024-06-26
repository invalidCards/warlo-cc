const searchParams = [
    '-type:land',
    'game:paper',
    '-type:Contraption',    //not maindeckable or ever castable, shouldn't count IMO
    '-type:Attraction',     //not maindeckable or ever castable, shouldn't count IMO
    'include:extras',       //we want stuff like playtest cards to be rollable
    '-layout:token',        //removes tokens, memorabilia cards, etc.
    '-type=Card',           //seems to get most of the random art cards and Jumpstart fronts
    '-layout:planar',       //Planechase cards
    '-layout:scheme',       //Archenemy cards
    '-type:conspiracy',     //Conspiracies can only exist in the command zone
]

const scryfallUrl = `https://api.scryfall.com/cards/random?q=${searchParams.map(v => v.replace(':', '%3A')).join('%20')}`;

function clickGo() {
    document.getElementById('reminder').innerText = '';
    document.getElementById('go').setAttribute('disabled', 'disabled');
    document.getElementById('btnTitle').innerText = "⏳ He's doing it..."
    console.log(scryfallUrl);
    fetch(scryfallUrl).then(resp => {
        resp.json().then(content => {
            console.log(content);
            if (document.getElementById('card-image-back').style.display === 'inline') {
                switchFace();
            }
            document.getElementById('card-name').innerText = content.name;
            document.getElementById('typeline').innerText = content.type_line;
            if (content.card_faces) {
                document.getElementById('card-image').src = content.card_faces[0].image_uris?.png || content.image_uris.png;
                document.getElementById('card-image-back').src = content.card_faces[1].image_uris?.png || '';
                document.getElementById('mana-cost').innerHTML = replaceMana(`${content.card_faces[0].mana_cost} // ${content.card_faces[1].mana_cost}`);
                document.getElementById('rules-text').innerHTML = replaceMana(`${fixOracleText(content.card_faces[0].oracle_text)}<br/><hr/>${fixOracleText(content.card_faces[1].oracle_text)}`);
                let ptFront = renderPT(content.card_faces[0].power, content.card_faces[0].toughness, true);
                let ptBack = renderPT(content.card_faces[1].power, content.card_faces[1].toughness, true);
                if (!(ptFront === 'N/A' && ptBack === 'N/A')) {
                    document.getElementById('pt').innerText = `${renderPT(content.card_faces[0].power, content.card_faces[0].toughness, true)} // ${renderPT(content.card_faces[1].power, content.card_faces[1].toughness, true)}`;
                } else {
                    document.getElementById('pt').innerText = '';
                }
                if (content.card_faces[1].image_uris) {
                    document.getElementById('flip-icon').style.display = 'inline';
                }
            } else {
                document.getElementById('card-image').src = content.image_uris.png;
                document.getElementById('mana-cost').innerHTML = replaceMana(content.mana_cost);
                document.getElementById('rules-text').innerHTML = replaceMana(fixOracleText(content.oracle_text));
                document.getElementById('pt').innerText = renderPT(content.power, content.toughness);
                document.getElementById('flip-icon').style.display = 'none';
            }
            resetButtonState();
        }).finally(() => {
            resetButtonState();
        });
    }).finally(() => {
        resetButtonState();
    });
}

function switchFace() {
    var front = document.getElementById('card-image');
    var back = document.getElementById('card-image-back');
    var icon = document.getElementById('flip-icon');
    if (front.style.display === 'inline') {
        front.style.display = 'none';
        back.style.display = 'inline';
        icon.firstChild.classList.remove('ms-dfc-back');
        icon.firstChild.classList.add('ms-dfc-front');
    } else {
        back.style.display = 'none';
        front.style.display = 'inline';
        icon.firstChild.classList.remove('ms-dfc-front');
        icon.firstChild.classList.add('ms-dfc-back');
    }
}

function resetButtonState() {
    document.getElementById('btnTitle').innerText = 'Discord Does the Thing';
    document.getElementById('go').removeAttribute('disabled');
}

function replaceMana(input) {
    var output = input;
    output = output.replaceAll('{T}', '<i class="ms ms-tap ms-cost ms-shadow"></i>');               //tap
    output = output.replaceAll('{Q}', '<i class="ms ms-untap ms-cost ms-shadow"></i>');             //untap
    output = output.replaceAll('{A}', '<i class="ms ms-acorn ms-cost ms-shadow"></i>');             //the one card with acorn counters
    output = output.replaceAll('{E}', '<i class="ms ms-energy"></i>');                              //energy needs no background
    output = output.replace(/\{(\d+|W|U|B|R|G|C|P|S|X)\}/g, (match, p1) => {                        //numerical + colors + X + snow
        return `<i class="ms ms-${p1.toLowerCase()} ms-cost ms-shadow"></i>`
    });
    output = output.replace(/\{(.*?)\/(.*?)\}/g, (match, p1, p2) => {                               //dual pips + phyrexian
        return `<i class="ms ms-${p1.toLowerCase()}${p2.toLowerCase()} ms-cost ms-shadow"></i>`;
    });
    output = output.replace(/\[[−-](\d+)\]/g, '<i class="ms ms-loyalty-down ms-loyalty-$1"></i>');  //negative loyalty
    output = output.replace(/\[0\]/g, '<i class="ms ms-loyalty-zero ms-loyalty-0"></i>');           //zero loyalty
    output = output.replace(/\[-(\d+)\]/g, '<i class="ms ms-loyalty-up ms-loyalty-$1"></i>');       //positive loyalty
    return output;
}

function fixOracleText(input) {
    return input.replaceAll('\n', '<br/><br/>').replaceAll('(', '<i>(').replaceAll(')', ')</i>');
}

function renderPT(p, t, renderNA) {
    if (!p || !t) {
        if (renderNA) return 'N/A';
        return '';
    }

    return `${p}/${t}`;
}