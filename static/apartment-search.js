var map;
var rentals = [];
var yelps = [];
var ZILLOW_FACTOR = 1000000;

function initMap() {
    createMap();

    createNeighborhoodsOverlay();

    //addZillowRentals();
}

function createMap() {
    // Create a map object and specify the DOM element for display.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 37.7833, lng: -122.4167},
        scrollwheel: true,
        zoom: 14
    });

    map.addListener('bounds_changed', function () {
        addZillowRentals();
        addYelpListings();
    });
}

function createNeighborhoodsOverlay() {
    var neighborhoods = new google.maps.KmlLayer({
        map: map,
        url: 'http://mapsengine.google.com/map/kml?mid=zadBxHIjeL1w.k18VDu5UiaG4'
    });
}

function clearRentals() {
    var oldRentals = rentals;
    rentals = [];

    while (oldRentals.length) {
        var rental = oldRentals.pop();
        rental.setMap(null);
    }
}

function clearYelps() {
    var oldYelps = yelps;
    yelps = [];

    while (oldYelps.length) {
        var yelp = oldYelps.pop();
        yelp.setMap(null);
    }
}

function addYelpListings() {
    var bounds = map.getBounds();
    console.log('getting yelp listings');

    $.ajax({
        url: '/yelp',
        data: {
            'find_desc': 'Restaurants',
            'find_loc': 'San%20Francisco%2C%20CA',
            'start': '0',
            'open_time': '1700',
            'l': 'g%3A-122.39481925964355%2C37.808501748061715%2C-122.42056846618652%2C37.78815542330758',
            'parent_request_id': '5e70250748867baf',
            'request_origin': 'user'
        },
        dataType: 'json'
    }).complete(function (req) {
        clearYelps();

        var data = req.responseJSON;
        var $searchContent = $(data.search_results);

        var results = data.search_map.markers;
        for (var key in results) {
            if (!results.hasOwnProperty(key)) {
                continue;
            }

            var result = results[key];
            var $hoverCard = $searchContent.find('[data-hovercard-id='+result.hovercard_id+']');

            var marker = new google.maps.Marker({
                position: {
                    lat: result.location.latitude,
                    lng: result.location.longitude
                },
                map: map,
                title: $hoverCard.text()
            });
        }
    })
}
addYelpListings = debounce(addYelpListings, 500);

function addZillowRentals() {
    var bounds = map.getBounds();
    console.log('getting zillow listings');

    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();
    $.ajax({
        url: '/zillow',
        data: {
            'spt': 'homes',
            'status': '000010',
            'lt': '000000',
            'ht': '111101',
            'pr': ',804696',
            'mp': ',3000',
            'bd': '0,',
            'ba': '0,',
            'sf': ',',
            'lot': ',',
            'yr': ',',
            'pho': '0',
            'pets': '0',
            'parking': '0',
            'laundry': '0',
            'pnd': '0',
            'red': '0',
            'zso': '0',
            'days': 'any',
            'ds': 'all',
            'pmf': '0',
            'pf': '0',
            'rect': [
                (sw.lng() * ZILLOW_FACTOR).toFixed(0).toString(),
                (sw.lat() * ZILLOW_FACTOR).toFixed(0).toString(),
                (ne.lng() * ZILLOW_FACTOR).toFixed(0).toString(),
                (ne.lat() * ZILLOW_FACTOR).toFixed(0).toString()
            ].join(','),     //'-122453743,37747066,-122378212,37830361',
            'p': '1',
            'sort': 'days',
            'search': 'maplist',
            'disp': '1',
            'rid': '20330',
            'rt': '6',
            'listright': 'true',
            'isMapSearch': '1',
            'zoom': '13'
        },
        dataType: 'json'
    })
    .complete(function (req) {
        clearRentals();

        var data = req.responseJSON;

        var props = data.map.properties;
        for (var idx = 0; idx < props.length; idx++) {
            var prop = props[idx];

            var marker = new google.maps.Marker({
                position: {
                    lat: prop[1] / ZILLOW_FACTOR,
                    lng: prop[2] / ZILLOW_FACTOR
                },
                map: map,
                title: prop[7][0]
            });
            rentals.push(marker);

            var href = 'http://www.zillow.com/homedetails//' + prop[0] + '_zpid/';
            var content =
                '<div>' +  // throwaway wrapper
                '<div class="rent-popup">' +
                    '<img height="46" width="46" class="zillow-image" />' +
                    '<div>Rent: <span class="rent"></span></div>' +
                    '<div>Beds: <span class="beds"></span></div>' +
                    '<div>Baths: <span class="baths"></span></div>' +
                    '<div><a href="' + href + '" target="_blank">Zillow</a>' +
                '</div>' +
                '</div>'; // /throwaway wrapper

            var $content = $(content);
            $content.find('.beds').text(prop[7][1]);
            $content.find('.baths').text(prop[7][2]);
            $content.find('.rent').text(prop[7][0]);
            $content.find('img').attr('src', prop[7][5]);
            marker.infoWindow = new google.maps.InfoWindow({
                content: $content.html()
            });

            marker.addListener('click', function() {
                this.infoWindow.open(map, this);
            });
        }
    })
    .error(function (req) {
        console.log("error making zillow api call", req);
    });
}
addZillowRentals = debounce(addZillowRentals, 500);

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};