export function loadData() {

    let rowValues = createRandom2DArray(getRandom(5, 10), 1, 10);
    let colValues = createRandom2DArray(getRandom(5, 10), 1, 10);
    return [rowValues, colValues]
}

export function loadRandomNonogram() {
    const request = new XMLHttpRequest();
    const protocol = import.meta.env.ENV_SERVER_PROTOCOL;
    const address = import.meta.env.ENV_SERVER_ADDRESS;
    request.open("GET", `${protocol}://${address}/api/v1/nonogram.getRandom`, false);
    request.withCredentials = true;
    request.send(null);

    if (request.status === 200) {
        const response = JSON.parse(request.responseText);
        return [response.rows, response.columns, response.data, response.id];
    } else {
        throw new Error('Failed to load nonogram');
    }
}

function createRandom2DArray(rows, min, max) {
    const arr = [];
    for (let i = 0; i < rows; i++) {
        arr[i] = [];
        let cols = getRandom(2, 5);
        for (let j = 0; j < cols; j++) {
            arr[i][j] = Math.floor(Math.random() * (max - min + 1)) + min;
        }
    }
    return arr;
}

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
