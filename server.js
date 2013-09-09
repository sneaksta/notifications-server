var formidable = require('formidable')
var http = require('http')

var server = http.createServer(function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    // Check for notices from PHP
    //if(res.socket.remoteAddress == 'localhost') {
        if (req.method == 'GET') {
            res.writeHead(200, [[ "Content-Type", "text/plain"]
                    , ["Content-Length", 0]
                    ]);
            res.write('');
            res.end();
        }
        else if (req.method == 'POST') {
            // The server is trying to send us an activity message
            var form = new formidable.IncomingForm();
            form.parse(req, function(err, fields, files) {

                res.writeHead(200, [[ "Content-Type", "text/plain"]
                        , ["Content-Length", 0]
                        ]);
                res.write('');
                res.end();

                //sys.puts(sys.inspect({fields: fields}, true, 4));
                var jsonStr = JSON.stringify(fields);
                var fields = JSON.parse(jsonStr);

                if (fields.secret_key == 'lj412ndflkgY09ajxf-3q34l321kj4156h60-QFkj68126k3j56') {
                    if (fields.channel == "process-notification") {
                        // Process the notification by executing a POST request to the API
                        // so that it can handle the message formatting etc in a non blocking way,
                        // then return it's results in a push back to the client
                        postJSON(fields.message, fields.endpoint, function(chunk) {
                            var data = JSON.parse(chunk)
                            console.log('emitting...')

                            // Return the notification
                            io.sockets.emit(data.channel, { message: data.message });

                            // Process our user's progress tracking with another api request
                            postJSON(data.message, data.endpoint, function(chunk) {
                                console.log('checking user progress...')
                                //console.log(chunk)
                            })
                        })
                    }
                    else {
                        console.log('emitting normal notif...')
                        io.sockets.emit(fields.channel, { message: fields.message, action: fields.action });
                    }
                }
                else {
                    // Bad access!
                }

                //io.sockets.on('connection', function (socket) {
                //    socket.emit(fields.channel, { message: fields });
                //})
            });
        }
    //}
});

var app = server
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(80);

function postJSON(jsonData, endpoint, callbackFn) {
   var body = JSON.stringify(jsonData)

    var request = new http.ClientRequest({
        hostname: "localhost",
        port: 80,
        path: endpoint,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": body.length // Often this part is optional
        }
    })

    //console.log('processing notification...')

    // Send the request
    request.write(body);
    request.end();
    request.on('response', function (response) {
        //console.log('STATUS: ' + response.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(response.headers));
        response.setEncoding('utf8');
        response.on('data', function (chunk) {
            // Call our specified callback function
            callbackFn(chunk);
        });
    });
}

// function handleServerNotice(fields) {
//         console.log(fields)
//         // socket.emit('news', { hello: 'world' });
//         socket.on('my other event', function (data) {
//             console.log(data);
//         });
// }