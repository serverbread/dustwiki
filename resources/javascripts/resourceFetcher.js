function fetchResource(url, tag, callback = () => {}) {
    if (tag !== 'script' && tag !== 'style') {
        console.error('tag must be "script" or "style"');
        return;
    }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.send();
    var res = null;
    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            callback(xhr.responseText);
        }
    };
}
