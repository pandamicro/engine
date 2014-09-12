
/**
 * 
 */
function ImageLoader(url, callback, onProgress) {
    var image = document.createElement('img');
    if (callback) {
        image.addEventListener('load', function () {
            callback(this);
        }, false);
        image.addEventListener('error', function (msg, line, url) {
            var error = 'Failed to load image: ' + msg + ' Url: ' + url;
            callback(null, error);
        }, false);
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
function _LoadFromXHR(url, callback, onProgress, responseType) {
    var xhr = new XMLHttpRequest();
    //xhr.withCredentials = true;   // INVALID_STATE_ERR: DOM Exception 11 in phantomjs
    var total = 0;
    xhr.onreadystatechange = function () {
        if (callback && xhr.readyState === xhr.DONE) {
            if (xhr.status === 200 || xhr.status === 0) {
                callback(xhr);
            }
            else {
                callback(null, 'LoadFromXHR: Could not load "' + url + '", status: ' + xhr.status);
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
    if (onProgress && 'onprogress' in xhr) {
        xhr.addEventListener('progress', function (event) {
            if (event.lengthComputable) {
                onProgress(event.loaded, event.total);
            }
        }, false);
    }
    xhr.send();
}

function TextLoader(url, callback, onProgress) {
    _LoadFromXHR(url, function(xhr, error) {
        if (xhr && xhr.responseText) {
            callback(xhr.responseText);
        }
        else {
            callback(null, 'LoadText: "' + url + 
                '" seems to be unreachable or the file is empty. InnerMessage: ' + error);
        }
    }, onProgress);
}
