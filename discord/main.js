const searchParams = [
    '(-t:land or ((is:mdfc or is:transform or is:flip) and t:land and (t:instant or t:sorcery or t:creature or t:enchantment or t:artifact)))', //we must be able to find the front cards of MDFCs et al. as well
    'game:paper',
    '-type:Contraption',    //not maindeckable or ever castable, shouldn't count IMO
    '-type:Attraction',     //not maindeckable or ever castable, shouldn't count IMO
    'include:extras',       //we want stuff like playtest cards to be rollable
    '-layout:token',        //removes tokens, memorabilia cards, etc.
    '-type=Card',           //seems to get most of the random art cards and Jumpstart fronts
    '-layout:planar',       //Planechase cards
    '-layout:scheme',       //Archenemy cards
    '-type:conspiracy',     //Conspiracies can only exist in the command zone
    '-type:hero',           //Functionally uncastable
    '-type:emblem',         //non-card gamepiece
]

const scryfallUrl = `https://api.scryfall.com/cards/random?q=${searchParams.map(v => v.replace(':', '%3A')).join('%20')}`;

function clickGo() {
    document.getElementById('reminder').innerText = '';
    document.getElementById('go').setAttribute('disabled', 'disabled');
    document.getElementById('btnTitle').innerText = "⏳ He's doing it..."
    fetch(scryfallUrl).then(resp => {
        resp.json().then(content => {
            if (content.card_faces) {
                let face = randomInt(content.card_faces.length);
                if (content.card_faces[face].type_line.includes("Land")) {
                    face === 1 ? face = 0 : face = 1; //Swap faces if we hit the land side of an MDFC/transform/flip/etc.
                }
                document.getElementById('card-name').innerText = content.card_faces[face].name;
                document.getElementById('typeline').innerText = content.card_faces[face].type_line;
                document.getElementById('card-image').src = content.card_faces[face].image_uris?.png || content.image_uris.png;
                document.getElementById('mana-cost-raw').innerText = content.card_faces[face].mana_cost;
                document.getElementById('mana-cost').innerHTML = replaceMana(content.card_faces[face].mana_cost);
                document.getElementById('rules-text-raw').innerText = fixOracleTextCanvas(content.card_faces[face].oracle_text);
                document.getElementById('rules-text').innerHTML = replaceMana(fixOracleText(content.card_faces[face].oracle_text));
                document.getElementById('pt').innerText = renderPT(content.card_faces[0].power, content.card_faces[face].toughness, true);
            } else {
                document.getElementById('card-name').innerText = content.name;
                document.getElementById('typeline').innerText = content.type_line;
                document.getElementById('card-image').src = content.image_uris.png;
                document.getElementById('mana-cost-raw').innerText = content.mana_cost;
                document.getElementById('mana-cost').innerHTML = replaceMana(content.mana_cost);
                document.getElementById('rules-text-raw').innerText = fixOracleTextCanvas(content.oracle_text);
                document.getElementById('rules-text').innerHTML = replaceMana(fixOracleText(content.oracle_text));
                document.getElementById('pt').innerText = renderPT(content.power, content.toughness);
            }
            resetButtonState();
        }).finally(() => {
            resetButtonState();
        });
    }).finally(() => {
        resetButtonState();
    });
}

function randomInt(max) {
    return Math.floor(Math.random() * max);
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
function fixOracleTextCanvas(input) {
    return input.replace(/\(.*?\)/gi, '');
}

function renderPT(p, t, renderNA) {
    if (!p || !t) {
        if (renderNA) return 'N/A';
        return '';
    }

    return `${p}/${t}`;
}

function paintAndPrint() {
    var canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 400;
    var context = canvas.getContext('2d');
    let textToWrite =
        `${document.getElementById('card-name').innerText}\n`+
        `${document.getElementById('mana-cost-raw').innerText}\n`+
        `${document.getElementById('typeline').innerText}\n`+
        `${document.getElementById('rules-text-raw').innerHTML.replaceAll('<br>', '\n')}`;
    if (document.getElementById('pt').innerText !== '') {
        textToWrite += `\n${document.getElementById('pt').innerText}`;
    }
    context.wrapText(textToWrite, 10, 20, 200, context.measureText('M').width * 1.2);
    printCanvas(canvas.toDataURL('image/png'));
};

function printCanvas(dataUrl)  
{  
    let windowContent = '<!DOCTYPE html>';
    windowContent += '<html>';
    windowContent += '<head><title>Print canvas</title></head>';
    windowContent += '<body>';
    windowContent += '<img src="' + dataUrl + '">';
    windowContent += '</body>';
    windowContent += '</html>';
    
    const printWin = window.open('', '', 'width=' + screen.availWidth + ',height=' + screen.availHeight);
    printWin.document.open();
    printWin.document.write(windowContent); 
    
    printWin.document.addEventListener('load', function() {
        printWin.focus();
        printWin.print();
        printWin.document.close();
        printWin.close();            
    }, true);
}
  
CanvasRenderingContext2D.prototype.wrapText = function (text, x, y, maxWidth, lineHeight) {
    var lines = text.split("\n");
    for (var i = 0; i < lines.length; i++) {
        var words = lines[i].split(' ');
        var line = '';
        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var metrics = this.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                this.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            }
            else {
                line = testLine;
            }
        }
        this.fillText(line, x, y);
        y += lineHeight;
    }
}
