window.onload = () => {
    var input = document.getElementById('snowflake');
    input.oninput = (ev) => {
        console.log('event fired');
        const resultElement = document.getElementById('result');

        const snowflake = ev.target.value;
        if (snowflake === '') {
            resultElement.innerText = '?';
            return;
        }

        if (isNaN(snowflake)) {
            resultElement.innerText = 'Input is not a number!';
            return;
        }

        const snowflakeBigInt = BigInt(snowflake);
        if (snowflakeBigInt < 500000000000000000n) {
            resultElement.innerText = 'Input is pretty small and probably not a valid snowflake.';
            return;
        }

        resultElement.innerText = getTumblrTimestamp(snowflake).toUTCString();
    };
    console.log(input);
}

function getTumblrTimestamp(snowflake) {
    const timestamp = BigInt(snowflake) >> 20n;
    const fromEpoch = timestamp + 1000000000000n;
    return new Date(Number(fromEpoch));
}