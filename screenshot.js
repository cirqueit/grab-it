var chunk = {
    self: this,
    on: false,
    colorOn : "#ff0000", 
    ctx: null,
    container: null,
    mode: 0,
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 0,
    px: 0,
    py: 0,
    dist: 0,
    minDist: 10,
    angle: 0,
    drawChunk : function() {
        this.setPolar();
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.save()
        this.ctx.translate(this.px, this.py);
        this.ctx.rotate(this.angle*Math.PI/180);
        this.ctx.fillRect(-this.dist, -this.dist, 2*this.dist, 2*this.dist);
        this.ctx.restore()

    },
    injectCanvas : function() {
        var canvasContainer = document.createElement('div');
        $(document.body).append(canvasContainer);
        canvasContainer.style.position="absolute";
        canvasContainer.style.left="0px";
        canvasContainer.style.top="0px";
        canvasContainer.style.width=$(document).width()+"px";
        canvasContainer.style.height=$(document).height()+"px";
        canvasContainer.style.zIndex = "999";
        this.container = canvasContainer;

        myCanvas = document.createElement('canvas');
        myCanvas.width=$(document).width()
        myCanvas.height=$(document).height()
        myCanvas.style.overflow = 'visible';
        myCanvas.style.position = 'absolute';
        myCanvas.style.left="0px";
        myCanvas.style.top="0px";

        this.ctx = myCanvas.getContext("2d");
        this.ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        $(canvasContainer).append(myCanvas);
    },
    toggle : function() {
        if(chunk.on){
            $(chunk.container).remove();
            chunk.container = null;
        } else {
            chunk.injectCanvas();
        }
        chunk.on = !chunk.on;
    },
    takeScreenshot : function(callback) {
        chrome.runtime.sendMessage({command: 'capture'}, function(response) {
            var data = response.screenshotUrl;
            var canvas = document.createElement('canvas');
            var img = new Image();
            img.onload = function() {
                canvas.width = $(window).width();
                canvas.height = $(window).height();
                canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
                callback(canvas);
            }
            img.src = data;
        });
    },
    setPolar : function(){
        this.dist = Math.sqrt(Math.pow((this.x0 - this.x1), 2) + Math.pow((this.y0 - this.y1), 2));
        this.angle = Math.atan2(this.y1 - this.y0, this.x1 - this.x0) * 180 / Math.PI;
    },
    grabChunk : function(){
        this.setPolar();
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        if(this.dist > this.minDist){
            setTimeout(function(){chunk.takeScreenshot(chunk.reduceChunk);}, 100);
        } else {
            console.log("too small...");
        }
        
    },
    reduceChunk : function(canvas) {
        self = chunk;
        var ctx = canvas.getContext('2d');
        ctx.translate(self.x0, self.y0);
        ctx.save();
        ctx.rotate(self.angle*Math.PI/180);
        ctx.restore();
        // ctx.fillRect(-dist, -dist, 2*dist, 2*dist);
        canvas2 = document.createElement('canvas');
        canvas2.height = canvas.height;
        canvas2.width = canvas.width;
        ctx2 = canvas2.getContext('2d');
        ctx2.save();
        ctx2.translate(-(self.x0 - 2*self.dist), -(self.y0 - 2*self.dist));
        ctx2.restore();
        ctx2.translate(self.dist, self.dist);
        ctx2.rotate((-90 - self.angle)*Math.PI/180);
        ctx2.restore();
        ctx2.translate(-self.x0, -self.y0);
        ctx2.drawImage(canvas, 0, 0);
        ctx2.restore();
        canvas3 = document.createElement('canvas');
        canvas3.height = 2*self.dist;
        canvas3.width = 2*self.dist;
        ctx3 = canvas3.getContext('2d');
        ctx3.drawImage(canvas2, 0, 0);
        // $(document.body).append(canvas3);
        chunk.sendChunk(canvas3);
    },
    sendChunk : function (canvas) {
        var dataURL = canvas.toDataURL();
        dataURL = dataURL.replace('data:image/png;base64,', '');
        $.ajax({
            type: "POST",
            url: "http://104.131.144.45:7000/uploaded_images/",
            data: dataURL
        }).done(function(o) {
            console.log('saved');
        });
    }
}

$(document).ready(function() {
    // chunk.injectCanvas();
    // chunk.toggle();

    $(document).keyup(function(e) {
        if(chunk.on){
            if(chunk.mode == 1) {
                console.log('escape')
                chunk.mode = 0;
                chunk.ctx.clearRect(0, 0, chunk.ctx.canvas.width, chunk.ctx.canvas.height);
            }
        }
    });
    $(document).mousemove(function(e) {
        if(chunk.mode == 1) {
            chunk.x1 = e.clientX;
            chunk.y1 = e.clientY;
            chunk.drawChunk();
        }
    });
    $(document).mousedown(function(e) {
        if(chunk.on){
            console.log('drag')
            chunk.x0 = e.clientX;
            chunk.y0 = e.clientY;
            chunk.px = e.pageX;
            chunk.py = e.pageY;
            chunk.mode = 1;
        }
    });
    $(document).mouseup(function(e) {
        if(chunk.mode == 1) {
            chunk.x1 = e.clientX;
            chunk.y1 = e.clientY;
            chunk.grabChunk();
            chunk.mode = 0;
        }
    });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.command == "toggle") {
      chunk.toggle();
      if(chunk.on){
          sendResponse({text: "ON"});
      } else {
          sendResponse({text: ""});
      }
    }
    return true;
});
