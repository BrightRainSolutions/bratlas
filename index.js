document.addEventListener('DOMContentLoaded', () => {
	mapboxgl.accessToken = 'pk.eyJ1IjoiYnJpZ2h0cmFpbiIsImEiOiJyMjgtNGk4In0.Y64dPMiS4Xi8BXRiDhWXyg';
	const map = new mapboxgl.Map({
		container: 'map',
		// that bright rain style
		style: 'mapbox://styles/brightrain/ck2pc8klt0c981cp9c2rwx9f1',
		bounds: [
			[-125, 48],
			[-70, 40]
		]
		//center: [-100, 45],
		//zoom: 4
	});
	// Add the control to the map.
	const geocoder = new MapboxGeocoder({
		accessToken: mapboxgl.accessToken,
		mapboxgl: mapboxgl
	});

	map.addControl(
		new MapboxGeocoder({
			accessToken: mapboxgl.accessToken,
			mapboxgl: mapboxgl
		})
	);

	map.addControl(
		new mapboxgl.GeolocateControl({
			positionOptions: {
				enableHighAccuracy: true
			},
			// When active the map will receive updates to the device's location as it changes.
			trackUserLocation: true,
			// Draw an arrow next to the location dot to indicate which direction the device is heading.
			showUserHeading: true
		})
	);

	document.getElementById("shareLocationBtn").onclick = () => {
		const {lng, lat} = map.getCenter();
		let url = window.location.host +
			window.location.pathname +
			"?lat=" + lat + "&lng=" + lng + "&zoom=" + map.getZoom();
		navigator.clipboard.writeText(url)
			.then(() => {
				document.getElementById("message").innerHTML = "Location url copied to your clipboard";
				document.getElementById("message").style.visibility = "visible";
				setTimeout(() => {
					document.getElementById("message").style.visibility = "hidden";
				}, 3000);
			})
			.catch(err => {
				document.getElementById("message").innerHTML = "Error sharing your location";
				document.getElementById("message").style.visibility = "visible";
				setTimeout(() => {
					document.getElementById("message").style.visibility = "hidden";
				}, 3000);
			});
	}

	map.on('load', () => {
		map.addSource('dem', {
			'type': 'raster-dem',
			'url': 'mapbox://mapbox.mapbox-terrain-dem-v1'
		});
		map.addLayer({
				'id': 'hillshading',
				'source': 'dem',
				'type': 'hillshade'
				// insert below waterway-river-canal-shadow;
				// where hillshading sits in the Mapbox Outdoors style
			} //,
			//'waterway-river-canal-shadow'
		);
		// check to see if there are parameters in the url
		const queryString = window.location.search;
		if (queryString !== "") {
			// if we have url params get them
			const urlParams = new URLSearchParams(queryString);
			if (urlParams.has('lat') && urlParams.has('lng')) {
				const lat = urlParams.get('lat');
				const lng = urlParams.get('lng');
				const zoom = urlParams.has('zoom') ? urlParams.get('zoom') : 16;
				map.jumpTo({
					center: [lng, lat],
					zoom: zoom
				});
			}
		}
	});
});