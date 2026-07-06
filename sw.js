self.addEventListener('install', event => {
    event.waitUntil(
        self.skipWaiting()
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        (async () => {
            const names =
                await caches.keys();

            await Promise.all(
                names
                    .filter(name =>
                        name.startsWith('opesar-')
                    )
                    .map(name =>
                        caches.delete(name)
                    )
            );

            await self.registration.unregister();

            const clients =
                await self.clients.matchAll({
                    type: 'window'
                });

            for (const client of clients) {
                client.navigate(
                    client.url
                );
            }
        })()
    );
});
