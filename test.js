
class test {
    messageListeners = [];

    constructor(appName, options) {
        window.testInstance = this;
        this.appName = appName;
        this.options = options;
        this.loadCSS();
        this.loadJS();
    }

    onMessageToServer(listener) {
        this.messageListeners.push(listener);
    }

    async test() {
        let appObject = {
            content: {
                app: this.options
            },
            onPrepared: () => setTimeout(() => window.app.onShowing(), 0)
        };

        // Make container and add app's html
        appObject.viewEl = document.createElement("div");
        appObject.viewEl.setAttribute("id", `app${this.appName}`);
        appObject.viewEl.setAttribute("class", "app");
        appObject.viewEl.innerHTML = await this.loadHTML(this.appName);
        document.body.append(appObject.viewEl);

        // Start the app's js code
        let classRef = eval(this.appName);
        window.app = new classRef(appObject);
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
}

window.sendAppMessage = (app, type, data) => {
    console.log(`sending message to Node ${app} ${type}`);
    if (window.testInstance) {
        window.testInstance.messageListeners.forEach(ml => ml(app, type, data));
    }
};
