# Api

如果你要使用DustWikI的api的话，可以查看此条目。

DustWiki api提供以下功能：

- [公告信息获取](#/api/broadcast)
- [获取条目内容](#/api/content/*)
- [用户信息查询](#/api/user/info)
- 全站搜索关键词
- 模板信息获取
- 查看客户端登录状态及UUID
- ~~用茶壶冲泡咖啡~~

接下来会向你展示各种api的用法

**Tips**: 每个api返回的json都带有一个`error`的boolean类型的属性，可凭借它来判断api调用是否成功，如果失败，大部分情况下还会有一个`msg`键值对，内部包含错误信息。


## <a id="/api/broadcast">/api/broadcast</a>

当你访问 */api/broadcast* 时，后端会向你返回诸如下面所示的json：

```
{
    "error": false,
    "broadcast": "默认的公告信息"
}
```

其中`broadcast`键就是公告信息，其值为存储在 *`<DustWiki>`*`/data/broadcast.txt`中的文本信息

## <a id="/api/content/*">/api/content/*</a>

当你访问 _/api/content/*_ 时，后端会向你返回诸如下面所示的json：

```
{
    "error": false,
    "ext": "md",
    "content": "感觉不如原神"
}
```

其中`ext`键是该条目的格式，或者说，文件拓展名。

而`content`键就是条目的内容了。

`ext`的值指定了`content`的格式，比如，`ext`的值为`"md"`，那么`content`的内容就是markdown格式的，可以用marked.js将其转换为html，而当`ext`的值为`"html"`时，就是html格式的。