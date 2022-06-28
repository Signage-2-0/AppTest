
class test {
    version = 20210628.01;
    messageListeners = [];
    prepared = false;
    showing = false;

    constructor(appName, options) {
        window.testInstance = this;
        this.appName = appName;
        this.options = options || {};
        this.loadCSS();
        this.loadJS();
        this.prepState();
    }

    onMessageToServer(listener) {
        this.messageListeners.push(listener);
    }

    prepState() {
        let style = document.createElement("style");
        style.innerHTML = 'div.stateButton { position:absolute;bottom:50px;right:50px;width:250px;height:100px;border-radius:50%;background:#3D409ACC;z-index:1000;text-align:center;line-height:100px;font-size:40px;color:white;font-family:Arial;cursor:pointer;}' +
            'div.stateButton[data-prepared="no"] { opacity: 0.4; }';
        document.head.append(style);

        let butEl = document.createElement("div");
        butEl.setAttribute("class", "stateButton");
        butEl.setAttribute("data-prepared","no");
        butEl.innerText = 'preparing';
        butEl.onclick = this.showClicked.bind(this);
        document.body.append(butEl);
    }

    async test() {
        let viewObject = {
            content: {
                app: this.options
            },
            onPrepared: () => this.preparedCalled.call(this),
            onEnded: () => window.app.onDestroy && window.app.onDestroy(),
            sendAppMessage: (app, type, data) => {
                console.log(`sending message to Node ${app} ${type}`);
                if (window.testInstance) {
                    window.testInstance.messageListeners.forEach(ml => ml(app, type, data));
                }
            }
        };

        // Make container and add app's html
        viewObject.viewEl = document.createElement("div");
        viewObject.viewEl.setAttribute("class", "app");

        let appContainer = document.createElement("div");
        appContainer.setAttribute("id", `app${this.appName}`);
        appContainer.setAttribute("class", "App");
        appContainer.innerHTML = await this.loadHTML(this.appName);
        viewObject.viewEl.append(appContainer);
        document.body.append(viewObject.viewEl);

        // Start the app's js code
        let classRef = eval(this.appName);
        window.app = new classRef(viewObject);
        window.app.prepare();
    }

    async loadHTML() {
        return new Promise(r => {
            let responded = false;
            try {
                let xhr = new XMLHttpRequest();
                xhr.timeout = 5000;
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            r(xhr.responseText);
                            responded = true;
                        } else {
                            console.error(`Error loading html from app ${this.appName}`);
                            r("");
                            responded = true;
                        }
                    }
                };

                xhr.ontimeout = () => {
                    r("");
                    console.error(`Timeout while loading html of app ${this.appName}`);
                    responded = true;
                };

                xhr.open("GET", `index.html`, true);
                xhr.setRequestHeader('Content-type', 'text/html');
                xhr.send();
            } catch (err) {
                console.error(err);
                r("");
                responded = true;
            }
        });
    }

    loadCSS() {
        let file = document.createElement("link");
        file.setAttribute("rel", "stylesheet");
        file.setAttribute("type", "text/css");
        file.setAttribute("href", `index.css`);
        document.getElementsByTagName("head")[0].appendChild(file);
    }

    loadJS() {
        let file = document.createElement('script');
        file.type = 'text/javascript';
        file.src = `index.js`;
        file.onload = function(ignore) { window.testInstance.test().then(); };
        document.getElementsByTagName("head")[0].appendChild(file);
    }

    preparedCalled() {
        this.prepared = true;
        console.log('prepared called');
        let sb = document.body.querySelector('.stateButton');
        sb.setAttribute("data-prepared","yes");
        sb.innerHTML = "prepared<br>show";
    }

    showClicked() {
        if (!this.prepared) return;
        if (this.showing) return;
        this.showing = true;
        console.log('show clicked');
        let sb = document.body.querySelector('.stateButton');
        sb.setAttribute("data-prepared","no");
        sb.innerHTML = "showing";
        window.app.onShowing();
    }
}
