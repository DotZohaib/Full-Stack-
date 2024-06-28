/*eslint-disable */

export default locations => {
    mapboxgl.accessToken =
        'pk.eyJ1IjoidHVhbmxlMjA3IiwiYSI6ImNrNzVvNG96MzBoZmIzbXNiMHhmb2J6OGsifQ.hDb2Uf0IHIHaeFbtDqxIYQ';

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/tuanle207/ck75uurk009fg1imo8zapr40x',
        scrollZoom: false
        // center: [-118.130196, 34.176979],
        // zoom: 10,
        // interactive: false
    });

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc => {
        // Create marker
        const el = document.createElement('div');
        el.className = 'marker';

        // Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        })
            .setLngLat(loc.coordinates)
            .addTo(map);

        new mapboxgl.Popup({
            offset: 30
        })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}: ${loc.description}<p>`)
            .addTo(map);

        // Extend the map bounds to include current location
        bounds.extend(loc.coordinates);
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });
};
