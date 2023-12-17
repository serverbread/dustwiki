function loadResource(El) {
    const tagName = El.tagName.toLowerCase();
    if (tagName !== 'script' && tagName !== 'style') return false;


        // 如果这个script有src属性，那么就加载它
        // 否则，挂载标签内部的内容
        const headEl = document.getElementsByTagName('head')[0];
        const childEl = document.createElement(tagName);
        if (El.src) {
            fetchResource(El.src, tagName, resourceData => {
                childEl.innerHTML = resourceData
            })
        } else {
            childEl.innerHTML = El.innerHTML;
        }
        
        headEl.appendChild(childEl);
        //console.debug(fetchResource(El.src, tagName));

        El.remove();
}