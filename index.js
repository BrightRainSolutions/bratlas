document.addEventListener('DOMContentLoaded', () => {
	// PWA support: register service worker
	if ("sw" in navigator) {
		window.addEventListener("load", () => {
		  navigator.serviceWorker
			.register("/sw.js")
			.then(res => console.log("service worker registered"))
			.catch(err => console.log("service worker not registered", err))
		})
	  }
	  
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
		center: [-100, 45],
		zoom: 0
	});

	map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

	// Add a geocoder search control to the map
	const geocoder = new MapboxGeocoder({
		accessToken: mapboxgl.accessToken,
		mapboxgl: mapboxgl,
		marker: false
	});
	map.addControl(geocoder);

	geocoder.on("result", data => {
		pinDrop.setLngLat(data.result.center);
		// get and show info
		getPinInfo(data.result.center[0], data.result.center[1]);
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
		// get and show info
		getPinInfo(lng, lat);
	});

	document.getElementById("share-location-btn").onclick = () => {
		//const {lng, lat} = map.getCenter();
		const {
			lng,
			lat
		} = pinDrop.getLngLat();
		let url = window.location.host +
			window.location.pathname +
			"?lat=" + lat.toFixed(5) + "&lng=" + lng.toFixed(5) + "&zoom=" + map.getZoom().toFixed(1);
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

	map.on('click', (e) => {
		pinDrop.setLngLat(e.lngLat);
		getPinInfo(e.lngLat.lng, e.lngLat.lat);
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

		const getRandomInRange = (from, to, fixed) => {
			return (Math.random() * (to - from) + from).toFixed(fixed) * 1;
			// .toFixed() returns string, so ' * 1' is a trick to convert to number
		}

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
				// get and show info
				// ToDo: do we want to do this when this is a shared pin url?
				getPinInfo(lng, lat);
			}
		}
		else {
			// if no parameters head to a random place on earth
			const lng = getRandomInRange(-180, 180, 2);
			// now here's the deal about latitude, getting random points from a sphere results in
			// over-representing toward the poles and as much as I'd to take credit
			// for this smart truth, it is documented here
			// https://mathworld.wolfram.com/SpherePointPicking.html
			// since, let's be honest, there isn't much there for an atlas
			// let's focus toward the middle more
			const lat = getRandomInRange(-60, 60, 2);
			map.flyTo({
				center: [lng, lat],
				zoom: 4
			});
			pinDrop.setLngLat([lng, lat]);
			getPinInfo(lng, lat);
		}
	});

	const getPinInfo = (lng, lat) => {
		const url = "https://api.mapbox.com/geocoding/v5/mapbox.places/" + lng +"," + lat + ".json?access_token=" + mapboxgl.accessToken;
		fetch(url)
		.then((response) => response.json())
		.then((data) => {
			if(data.features.length > 0) {
				// build the info box content to show the country and place
				// as well as a link to the country\place in wikipedia
				// https://www.wikidata.org/wiki/Wikidata:Data_access
				let content = "";
				let countryFeature = data.features.find(f => f.place_type.find(pt => pt ==="country"));
				if(countryFeature) {
					content += `<h1> ${countryFeature.place_name}</h1>`;
				}
				if(countryFeature.properties.wikidata) {
					content += `<a href="http://www.wikidata.org/entity/${countryFeature.properties.wikidata}" target=_blank>more data about <b>${countryFeature.place_name}</b></a>`;
				}
				let placeFeature = data.features.find(f => f.place_type.find(pt => pt === "place"));
				if(placeFeature) content += `<p>${placeFeature.place_name}</p>`;
				document.getElementById("info-content").innerHTML = content;
			}
			else {
				document.getElementById("info-content").innerHTML = "<b class='primary-blue'>OCEAN!</b>";
			}
			
		});
	}
});