
class test {
    messageListeners = [];
    prepared = false;

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
        style.innerHTML = 'div.stateButton { position:absolute;bottom:50px;right:50px;width:150px;height:150px;border-radius:50%;background:#3D409ACC;z-index:1000;text-align:center;line-height:150px;font-size:40px;color:white;font-family:Arial;cursor:pointer;}' +
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
        viewObject.viewEl.setAttribute("id", `app${this.appName}`);
        viewObject.viewEl.setAttribute("class", "app");
        viewObject.viewEl.innerHTML = await this.loadHTML(this.appName);
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

                xhr.open("GET", `${this.appName}.html`, true);
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
        file.setAttribute("href", `/${this.appName}/${this.appName}.css`);
        document.getElementsByTagName("head")[0].appendChild(file);
    }

    loadJS() {
        let file = document.createElement('script');
        file.type = 'text/javascript';
        file.src = `/${this.appName}/${this.appName}.js`;
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
        console.log('show clicked');
        let sb = document.body.querySelector('.stateButton');
        sb.setAttribute("data-prepared","no");
        sb.innerHTML = "showing";
        window.app.onShowing();
    }
}
