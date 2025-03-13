class WebkitBridge {
    values = {};
    valueListeners = {};

    onValueUpdated(key, listener) {
        if (!this.valueListeners[key]) {
            this.valueListeners[key] = [];
        }
        this.valueListeners[key].push(listener);
        if (this.values[key] !== undefined) {
            listener(this.values[key]);
        }
        return () => {
            const index = this.valueListeners[key].indexOf(listener);
            if (index !== -1) {
                this.valueListeners[key].splice(index, 1);
            }
        };
    }

    requestValue(endpoint) {
        if (window.webkit && window.webkit.requestValue) {
            window.webkit.requestValue(endpoint);
        }
        if (
            window.webkit &&
            window.webkit.messageHandlers &&
            window.webkit.messageHandlers[endpoint]
        ) {
            window.webkit.messageHandlers[endpoint].postMessage({});
        }
    }

    setValue(key, value) {
        this.values[key] = value;
        this.valueListeners[key].forEach(f => f(value));
    }
}

export const webkitBridge = new WebkitBridge();

// iOS can call this for everything we need to expose
window.SC_WEBKIT_BRIDGE = webkitBridge;
