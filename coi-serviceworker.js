/*! coi-serviceworker v0.1.7 | MIT License | https://github.com/gzuidhof/coi-serviceworker */
if (typeof window === 'undefined') {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

    self.addEventListener("fetch", (event) => {
        if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") {
            return;
        }

        event.respondWith(
            fetch(event.request).then((response) => {
                if (response.status === 0) {
                    return response;
                }

                const newHeaders = new Headers(response.headers);
                newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
                newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: newHeaders,
                });
            })
        );
    });
} else {
    (() => {
        const sc = document.createElement("script");
        sc.src = window.document.currentScript.src;
        sc.id = "coi-serviceworker";
        const reload = () => window.location.reload();

        if (window.crossOriginIsolated !== undefined && !window.crossOriginIsolated && window.origin.startsWith("http")) {
            navigator.serviceWorker.register(window.document.currentScript.src).then((registration) => {
                if (registration.active) {
                    reload();
                } else {
                    registration.addEventListener("updatefound", () => {
                        const newValue = registration.installing;
                        newValue.onstatechange = () => {
                            if (newValue.state === "activated") reload();
                        };
                    });
                }
            }, (err) => {
                console.error("COI-ServiceWorker registration failed: ", err);
            });
        }
    })();
}
