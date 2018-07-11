$(document).ready(function () {

    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
    });

});

//Class to represent a location
function Location(details) {
    var self = this;
    self.name = details.name;
    self.latitude = details.location.latitude;
    self.longitude = details.location.longitude;
    self.category = details.category;
    self.id = details.id;
};


var ViewModel = function () {
    var self = this;
    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 33.74899, lng: -84.38798},
        zoom: 14
    });

    var markers = []
    var largeInfowindow = new google.maps.InfoWindow();
    var bounds = new google.maps.LatLngBounds();

    // Types of food: American, Korean, Japanese, Vietnamese
    self.restaurants = [
        {name: "The Vortex Bar & Grill", category: "American", id: "4387a580f964a520062b1fe3", location: {lat:33.778702, lng:-84.384290}},
        {name: "B's Cracklin' Barbecue", category: "American", id: "57dc6d45498e4bf3f5fcb601", location: {lat:33.812053, lng:-84.472083}},
        {name: "Jinya Ramen Bar", category: "Japanese", id: "597b6aaeb2958f7e5242c4dd" , location: {lat:33.856584, lng:-84.382726}},
        {name: "Kula Revolving Sushi Bar", category: "Japanese", id: "596f7f8c0d2be7101e37c1e3", location: {lat:33.907699, lng:-84.288033}},
        {name: "Breaker's Korean BBQ", category: "Korean", id: "54bd8c82498e4279526f1494", location: {lat:33.957061, lng:-84.129167}},
        {name: "Woo Nam Jeong Stone Bowl House", category: "Korean", id: "4b6dfe10f964a520c2a12ce3", location: {lat:33.912819, lng:-84.261869}},
        {name: "Lee's Bakery", category: "Vietnamese", id: "4a6a17b3f964a5209dcc1fe3", location: {lat:33.859944, lng:-84.308550}},
        {name: "Nam Phuong Restaurant", category: "Vietnamese", id: "4de0483522713271e2b0d2b4", location: {lat:33.861161, lng:-84.307604}}
    ];


    var locations_array = []
    for (var i = 0; i < self.restaurants.length; i++) {
        locations_array.push(new Location(self.restaurants[i]))
    }

    self.locations = ko.observableArray(locations_array);
    self.categories = ko.observableArray(['All', "American", "Japanese", "Korean", "Vietnamese"]);
    self.selected = ko.observable(self.categories()[0]);
    
    

    self.selected.subscribe(function(newValue) {
        largeInfowindow.close()

        self.locations.removeAll()
        for (var i = 0; i < self.restaurants.length; i++) {
            category = self.restaurants[i].category;
            if (newValue === "All" || category === newValue) {
                self.locations.push(new Location(self.restaurants[i]));
            }
        }

        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < markers.length; i++) {
            marker = markers[i];
            if (newValue === "All" || marker.category === newValue) {
                marker.setMap(map);
                marker.setAnimation(google.maps.Animation.DROP);
                bounds.extend(marker.position);
            }
            else {
                marker.setMap(null);
            }
        }
        map.fitBounds(bounds);
    });

    for (var i = 0; i < self.restaurants.length; i++){
        var position = self.restaurants[i].location;
        var title = self.restaurants[i].name;
        var category = self.restaurants[i].category;
        var id = self.restaurants[i].id;
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            category: category,
            animation: google.maps.Animation.DROP,
            id: id
        });
        markers.push(marker);
        bounds.extend(marker.position);
        marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
        })
    }
    map.fitBounds(bounds);



    self.setLocation = function(location) {
        markers.forEach(function(marker) {
            if (marker.title === location.name) {
                populateInfoWindow(marker, largeInfowindow);
            }
        })
    };

};

// cache the foursquare response if the same venue is chosen twice
self.cache = {}

function populateInfoWindow(marker, infowindow) {

    // Enrich with Foursquare data
    if (infowindow.marker != marker) {
        infowindow.marker = marker;

        if (marker.id in self.cache) {
            console.log("Using cached Foursquare API response")
            success(self.cache[marker.id])
        }
        else {
            console.log("Getting Foursquare API response");
            client_id = "T1EQSRA5LX0DMOQ14MZNJJAEX5GTAGZXIRZAKTO41MQFTK0U";
            client_secret = "NUFEWYMAVBIRTDXWCWZKT0JFWYSLZBT2YD4OZJVEVZBKU5GP";
            var uri = 'https://api.foursquare.com/v2/venues/' + marker.id + '?client_id=' + client_id + '&client_secret=' + client_secret + '&v=20180704';
            // Foursquare API
            $.getJSON(uri).done(success
            ).fail(function() {
                // Send alert
                alert(
                    "There was an issue loading the Foursquare API."
                );
            });
        };

        function success(data) {
            console.log(data)
            var venue = data.response.venue;
            address = venue.location.formattedAddress;
            rating = venue.rating;
            photo = venue.bestPhoto.prefix + '260x180' + venue.bestPhoto.suffix;
            info_html = `
            <div class="container-flex">
                <div class="card" style="width: 26rem;">
                    <img class="card-img-top" src='${photo}' alt='${marker.title}'>
                    <div class="card-body">
                        <h5 class="card-title">${marker.title}</h5>
                        <p class="card-text">${address}</p>
                        <p class="card-text">Rating: ${rating}</p>
                    </div>
                </div>
            </div>
            `;
            infowindow.setContent(info_html);
            self.cache[marker.id] = data
        }

        // infowindow.setContent('<div>' + marker.title + '</div>')
        infowindow.open(map, marker);
        infowindow.addListener('closeclick', function() {
            infowindow.setMarker(null);
        });
        console.log(self.cache);
    }
    // Bounces twice on selection
    marker.setAnimation(google.maps.Animation.BOUNCE);
    marker.setAnimation(4);

}

function initApp() {
    console.log('in  init');
    ko.applyBindings(new ViewModel());
}