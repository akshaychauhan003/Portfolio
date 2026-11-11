/**
 * Architect Mobile Dashboard Service Worker
 * Handles offline caching, PWA installation lifecycle, and Web Push Notifications
 */

const CACHE_NAME = 'architect-dashboard-v1';
const ASSETS_TO_CACHE = [
    './index.html',
    './dashboard.css',
    './dashboard.js',
    './icon.png',
    './manifest.json',
    './toing.wav',
    '../assets/js/supabase-config.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Stale-while-revalidate strategy for dashboard files
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => cachedResponse);
            return cachedResponse || fetchPromise;
        })
    );
});

// Push Notifications Listener (Triggers native Android Notification)
self.addEventListener('push', (event) => {
    let data = { title: 'New Portfolio Notification', body: 'You have a new inquiry or review pending.' };
    if (event.data) {
        try {
            data = event.data.json();
        } catch {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: './icon.png',
        badge: './icon.png',
        vibrate: [200, 100, 200],
        data: { url: './index.html' },
        actions: [
            { action: 'open', title: 'Open Dashboard' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes('dashboard') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('./index.html');
            }
        })
    );
});
