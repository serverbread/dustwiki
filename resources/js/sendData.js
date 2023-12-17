function sendData(data, path) {
    var xhr = new XMLHttpRequest();
    xhr.open('post', path, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
    document.getElementById('status').value = '已发送';
    xhr.onreadystatechange = () => {
        console.log(typeof xhr.response);
        const data = JSON.parse(xhr.response);

        document.getElementById('status').value = data.msg;
        document.getElementById('status').style.color = !data.error
            ? 'green'
            : 'red';
    };
}
