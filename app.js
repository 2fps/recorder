var http = require('http'),
    fs = require('fs'),
    ROAClient = require('@alicloud/pop-core').ROAClient,
    request = require('request');

http.createServer(function(req, res) {
    // 首页显示
    if (req.url == '/' && req.method.toLowerCase() == 'get') {
        res.writeHead(200, {'content-type': 'text/html'});

        fs.readFile('view/index.html',function(err, data){
            if (err) {
                console.log('error');
            } else {
                res.end(data);
            }
        });
    }
    // record.js文件
    if (req.url == '/recorder.js' && req.method.toLowerCase() == 'get') {
        res.writeHead(200, {'content-type': 'text/html'});

        fs.readFile('js/recorder.js',function(err,data){
            if (err) {
                console.log('error');
            } else {
                res.end(data);
            }
        });
    }
    if (req.url == '/speech' && req.method.toLowerCase() == 'post') {
        // 缓存二进制数据
        var data = [];

        req.on('data', function(chunk) {
            data.push(chunk);
        }).on('end', function() {
            var buffer = Buffer.concat(data);

            // 录音文件发送的options
            const options = {
                url: 'http://nls-gateway.cn-shanghai.aliyuncs.com/stream/v1/asr?appkey=UL9Xm7wmBiTa2YmW&sample_rate=16000&format=pcm',
                method: 'POST',
                headers: {
                    'X-NLS-Token': '',
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': buffer.length,
                    'Host': 'nls-gateway.cn-shanghai.aliyuncs.com'
                },
                body: buffer
            };
            
            var client = new ROAClient({
                accessKeyId: '',            // 添加
                accessKeySecret: '',        // 添加
                endpoint: 'http://nls-meta.cn-shanghai.aliyuncs.com',
                apiVersion: '2018-05-18'
            });

            client.request('POST', '/pop/2018-05-18/tokens').then((result) => {
                console.log('tokenId', result.Token.Id);
                // 这个token是带超时的，应该有更好的保管方式而不是每次都是去请求。
                options.headers['X-NLS-Token'] = result.Token.Id;

                request(options, function(error, response, body) {
                    if (error) {
                    return console.error('upload failed:', error);
                    }
                    console.log('Upload successful!  Server responded with:', body);
                    // 将检测的结果发送给客户端
                    res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
                    res.end(body);
                });
            });
        });
    }
}).listen(8080);
