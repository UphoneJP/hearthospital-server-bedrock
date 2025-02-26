const position = {
    lat: hospital.lat,
    lng: hospital.lng
};
const mapOptions = {
    center: position,
    zoom: 12,
    mapId: "9aafa4f7de596128"
};

const loader = new google.maps.plugins.loader.Loader({ 
    apiKey: "AIzaSyBxUS03MOJYS4Gj8aDIpmWuNDO_ztjNOCg",
    version: "weekly",
    libraries: ["places"],
});

loader.importLibrary('maps')
.then(async ({Map}) => {
    const map = new Map(document.getElementById("map"), mapOptions);
    const {AdvancedMarkerElement} = await loader.importLibrary('marker');
    const marker = new AdvancedMarkerElement({map, position});
})
.catch((e) => {
    console.log('エラー',e);
});