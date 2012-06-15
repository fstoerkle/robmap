function failed(expected, other) {
    return Error("assertEqual() failed:\n\t" + expected + " expected\n\t" + other + " got");
}

function runTests(callback) {
    var result = document.getElementById('result');
    try {
        callback();
        result.style.color = 'green';
        result.innerHTML = 'All tests passed.'
    } catch (error) {
        if (!error.message.match(/assertEqual/)) {
            throw error;
        }
        result.innerHTML = 'FAIL<br><pre>' + error.message + '</pre>';
        result.style.color = 'red';
    }
}

function assertEqual(expected, other) {
    if ( expected !== other) {
        throw failed(expected, other);
    }
}

function assertEqualArray(expected, other) {
    if (expected.length === other.length) {
        for (var i=0; i<expected.length; ++i) {
            try {
                assertEqual(expected[i], other[i]);
            } catch (error) {
                throw failed(expected, other);
            }
        }
    } else {
        throw failed(expected, other);
    }
}