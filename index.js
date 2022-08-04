document.addEventListener('DOMContentLoaded', () => {
	mapboxgl.accessToken = 'pk.eyJ1IjoiYnJpZ2h0cmFpbiIsImEiOiJyMjgtNGk4In0.Y64dPMiS4Xi8BXRiDhWXyg';
	const map = new mapboxgl.Map({
		container: 'map',
		// that bright rain style
		style: 'mapbox://styles/brightrain/ck2pc8klt0c981cp9c2rwx9f1',
		// ToDo: hate disabling this but double click also fires the single click which
		// moves our marker to that location
		// gotta be a workaround, right?
		// tried the settimeout trick to determine single or double click but no workie
		doubleClickZoom: false,
		bounds: [
			[-125, 48],
			[-70, 40]
		]
		//center: [-100, 45],
		//zoom: 4
	});

	// Add a geocoder search control to the map
	const geocoder = new MapboxGeocoder({
		accessToken: mapboxgl.accessToken,
		mapboxgl: mapboxgl,
		marker: false
	});
	map.addControl(geocoder);

	geocoder.on("result", data => {
		pinDrop.setLngLat(data.result.center);
		// enable the share button
		const shareBtn = document.getElementById("shareLocationBtn");
		shareBtn.innerHTML = "SHARE PIN LOCATION";
		shareBtn.disabled = false;
	});

	const geolocate = new mapboxgl.GeolocateControl({
		positionOptions: {
			enableHighAccuracy: true
		},
		// When active the map will receive updates to the device's location as it changes.
		trackUserLocation: true,
		// Draw an arrow next to the location dot to indicate which direction the device is heading.
		showUserHeading: true
	});
	map.addControl(geolocate);

	geolocate.on('geolocate', (position) => {
		// put the marker on the location
		pinDrop.setLngLat([position.coords.longitude, position.coords.latitude]);
		// enable the share button
		const shareBtn = document.getElementById("shareLocationBtn");
		shareBtn.innerHTML = "SHARE PIN LOCATION";
		shareBtn.disabled = false;
	});

	document.getElementById("shareLocationBtn").onclick = () => {
		//const {lng, lat} = map.getCenter();
		const {
			lng,
			lat
		} = pinDrop.getLngLat();
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

	const pin = document.createElement('div');
	pin.className = 'marker';
	// Add marker to the map
	let pinDrop = new mapboxgl.Marker(pin, {
		offset: [0, -36],	
		draggable: true
	})
	// off to null island
	// ToDo: figure out if/how to not show this at all initially
	.setLngLat([0, 0])
	.addTo(map);

	// change button text when clicked the first time
	map.once('click', (e) => {
		const shareBtn = document.getElementById("shareLocationBtn");
		shareBtn.innerHTML = "SHARE PIN LOCATION";
		shareBtn.disabled = false;
	});

	map.on('click', (e) => {
		pinDrop.setLngLat(e.lngLat);
	});

	map.on('load', () => {
		map.addSource('dem', {
			'type': 'raster-dem',
			'url': 'mapbox://mapbox.mapbox-terrain-dem-v1'
		});
		map.addLayer({
				'id': 'hillshading',
				'source': 'dem',
				'type': 'hillshade'
			}
		);
		// check to see if there are parameters in the url
		const queryString = window.location.search;
		if (queryString !== "") {
			// if we have url params get them
			const urlParams = new URLSearchParams(queryString);
			if (urlParams.has('lat') && urlParams.has('lng')) {
				const lat = urlParams.get('lat');
				const lng = urlParams.get('lng');
				// if there is a zoom parameter use it otherwise default
				const zoom = urlParams.has('zoom') ? urlParams.get('zoom') : 16;
				map.flyTo({
					center: [lng, lat],
					zoom: zoom
				});
				pinDrop.setLngLat([lng, lat]);
				// set button text and enable
				const shareBtn = document.getElementById("shareLocationBtn");
				shareBtn.innerHTML = "SHARE PIN LOCATION";
				shareBtn.disabled = false;
			}
		}
	});
});