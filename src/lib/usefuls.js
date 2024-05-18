export async function preloadScript(url, cb) {
    return new Promise(resolve => {
        const script_el = document.createElement('script');
        script_el.addEventListener('load', () => {
            script_el.remove();
            typeof cb === 'function' && cb();
            resolve();
        });
        script_el.src = url;
        document.head.append(script_el);
    });
}

export function preloadCSS(url) {
    return new Promise(resolve => {
        const link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.onload = resolve;
        link.href = url;
        document.head.append(link);
    });
}

export async function hostReactAppReady(selector = '#__next > div', timeout = 500, cb) {
    return new Promise(resolve => {
        const waiter = () => {
            const host_el = document.querySelector(selector);
            if (host_el?.getBoundingClientRect().height) {
                resolve();
            } else {
                setTimeout(waiter, timeout);
            }
        };
        waiter();
    });
}

export async function globalDependency(globalPropName, libUrlOrList, parallel = true, cb) {
    if (window[globalPropName]) {
        cb && cb();
        return Promise.resolve()
    } else {
        const urlsList = Array.isArray(libUrlOrList) ? libUrlOrList : [libUrlOrList];
        if (parallel) {
            const promises = [];
            for (const url of urlsList) {
                promises.push(~url.indexOf('.css') ? preloadCSS(url) : preloadScript(url));
            }
            return new Promise(async resolve => {
                await Promise.all(promises);
                cb && cb();
                resolve();
            });
        } else {
            return new Promise(async resolve => {
                for (const url of urlsList) {
                    ~url.indexOf('.css') ? await preloadCSS(url) : await preloadScript(url);
                }
                resolve();
            });
        }
    }
}

export async function asap(cb) {
    if (['complete', 'interactive'].includes(document.readyState)) {
        cb && cb();
        return Promise.resolve();
    }
    return new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', () => {
            cb && cb();
            resolve();
        });
    });
}