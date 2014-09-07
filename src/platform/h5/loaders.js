/**
 * 
 */

function LoadImage(url, onLoad, onError, onProgress) {
    var image = document.createElement('img');
    if (onLoad) {
        image.addEventListener('load', onLoad, false);
    }
    if (onError) {
        image.addEventListener('error', onProgress, false);
    }
    if (onProgress) {
        image.addEventListener('progress', onProgress, false);
    }
    image.src = url;
    return image;
}

/**
 * @param {string} [responseType="text"] - the XMLHttpRequestResponseType
 */
function LoadFromXHR(url, onLoad, onError, onProgress, responseType) {
    var xhr = new XMLHttpRequest();
    var total = 0;
    xhr.onreadystatechange = function () {
        if (onLoad && xhr.readyState === xhr.DONE) {
            if (xhr.status === 200 || xhr.status === 0) {
                onLoad(xhr);
            }
            else {
                onError('LoadFromXHR: Could not load "' + url + '", status: ' + xhr.status);
            }
        }
        if (onProgress && xhr.readyState === xhr.LOADING && !('onprogress' in xhr)) {
            if (total === 0) {
                total = xhr.getResponseHeader('Content-Length');
            }
            onProgress(xhr.responseText.length, total);
        }
        if (onProgress && xhr.readyState === xhr.HEADERS_RECEIVED) {
            total = xhr.getResponseHeader("Content-Length");
        }
    };
    xhr.open("GET", url, true);
    if (responseType) {
        xhr.responseType = responseType;
    }
    if ('onprogress' in xhr) {
        xhr.addEventListener('progress', function (event) {
            if (event.lengthComputable) {
                onProgress(event.loaded, event.total);
            }
        }, false);
    }
    xhr.send();
}

function LoadText(url, onLoad, onError, onProgress) {
    LoadFromXHR(url, function(xhr) {
        if (xhr.responseText) {
            onLoad(xhr.responseText);
        }
        else {
            onError('LoadText: "' + url + '" seems to be unreachable or the file is empty.');
        }
    },
    onError, onProgress);
}
