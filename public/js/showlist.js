const mapOptions = {
    center: {lat: 37, lng: 139},
    zoom: 5,
    mapId: "9aafa4f7de596128"
};

const initMap = async() => {
    try{
        const loader = new google.maps.plugins.loader.Loader({ 
            apiKey: "AIzaSyBh4A_h5-xu0jKSf72kOK5y7F7BbKHPEbY",
            version: "weekly",
            libraries: ["places"],
        });
        const googleMaps = await loader.importLibrary('maps')
        const map = new google.maps.Map(document.getElementById("map"), mapOptions);
        const Clusterer = await MarkerClusterer.getClusterer()
        if (Clusterer) {
            const clusterer = new Clusterer.Builder(map)
            .withMaxZoom(7)
            .build();
            createMarkers(clusterer);
        }
        
        function createMarkers(clusterer) {
            let currentInfoWindow = null;
            for(let hospital of hospitals){
                const position = {
                    lat: hospital.lat,
                    lng: hospital.lng
                };
                const marker = clusterer.createMarker({
                    map,
                    position,
                    title: hospital.hospitalname
                });
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <h5><a href= "/hospital/${hospital._id}">${hospital.hospitalname}</a></h5>
                        <p><small>口コミ${hospital.filteredReviewsCount || 0}件</small></p>
                    `
                });
                google.maps.event.addListener(marker, 'click', function() {
                    if (currentInfoWindow) {
                        currentInfoWindow.close();
                    }
                    infoWindow.open(map, marker);
                    currentInfoWindow = infoWindow;

                    // 少し遅らせて DOM にアクセス
                    setTimeout(() => {
                        const infoWindowLink = document.querySelector('.gm-style-iw a');
                        if (infoWindowLink) {
                            infoWindowLink.addEventListener('click', () => {
                                const loading = document.getElementById('loading-indicator');
                                if (loading) {
                                    loading.classList.remove('d-none');
                                }
                            });
                        }
                    }, 100);
                });
            }
        }
    } catch(e){
        console.log('エラー',e);
    }
}

initMap();
    
for(let area of areas){
    document.getElementById(`btn${area}`).addEventListener('click', (event) => {
        if(event.target.ariaExpanded === "false"){
            mapOptions.center = {lat: 36, lng: 139};
            mapOptions.zoom = 5;
        } else {
            if(area === '北海道・東北地方'){
                mapOptions.center = {lat: 41, lng: 141};
                mapOptions.zoom = 6;
            } else if (area === '関東地方'){
                mapOptions.center = {lat: 36, lng: 139.5};
                mapOptions.zoom = 8;
            } else if (area === '中部地方'){
                mapOptions.center = {lat: 36, lng: 138};
                mapOptions.zoom = 7;
            } else if (area === '近畿地方'){
                mapOptions.center = {lat: 34.5, lng: 135.5};
                mapOptions.zoom = 8;
            } else if (area === '中国・四国地方'){
                mapOptions.center = {lat: 34.3, lng: 133};
                mapOptions.zoom = 7;
            } else if (area === '九州・沖縄地方'){
                mapOptions.center = {lat: 30, lng: 129.5};
            mapOptions.zoom = 6;
            }
        }
        initMap();
    });
}
