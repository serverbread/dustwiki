console.log('预加载启动...')
let contentPath = window.location.href
    .replace('https://', '')
    .replace(window.location.href.split('/')[2], '')
    .replace('/', ''); // 当前路由所对文章的路径，such as '114514.md'
const titleEl = document.getElementsByTagName('title')[0]; // 网页的标题元素

fetch(
    `https://${
        window.location.toString().split('/')[2]
    }/api/content/${contentPath}`,
)
    .then(res => {
        if (!res.ok) {
            document.getElementById('edit').disabled = true;
            document.getElementById('go-edit').disabled = true;
            console.error(res.status);
        }
        return res.json();
    })
    .then(data => {
        const insertContent =
            data.ext === !'md' ? data.content : marked.parse(data.content);
        document.getElementById('content').innerHTML += insertContent;
        titleEl.innerText += document.querySelector('#content h1').innerText;
        document.getElementById('go-edit').href = `/editor/${contentPath}`;
        //console.log(document.getElementById('go-edit'));
        //console.debug(document.querySelector('#content script'));
        // 加载js文件
        if (document.querySelector('#content script') !== null) {
            const scriptEls = document.querySelectorAll('#content script');
            console.debug('#content下的script标签列表：');
            console.debug(scriptEls)
            for (let i in scriptEls) {
                if (i === 'item') break;
                console.debug('正在加载#content下的第' + (Number(i) + 1) + '个js...')
                loadResource(scriptEls[i]);
            }
        }
        console.log('加载模板...');
    });
