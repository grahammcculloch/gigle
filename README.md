# Gigle finds gigs near you
Gigle uses a combination of [Google Maps Javascript API (v3)](https://developers.google.com/maps/documentation/javascript/) and [Songkick's public API](http://www.songkick.com/developer/) to display upcoming concerts and gigs nearby your current location. Alternatively you can search for a specific location.

### W3C Location
The [W3C Geolocation API](http://en.wikipedia.org/wiki/W3C_Geolocation_API) is used to determine the user's location. The user will be prompted to allow/deny this service. If the user denies this service, they will still be able to search for a location instead.

### Installation
The Gigle source code is [hosted on Github](https://github.com/grahammcculloch/gigle).

To install, clone the repository:

```
$ git clone https://github.com/grahammcculloch/gigle.git
```

Build the dependencies:

```
$ cd gigle
$ npm install
```

Run the app (on MacOS or Linux):

```
$ DEBUG=gigle npm start
```

On Windows, use this command:

```
> set DEBUG=gigle & npm start
```

Then load `http://localhost:3000/` in your browser to access the app.

### Live site
Gigle is currently being served from [Cloud9](https://c9.io/). You can view the live site here:
[https://gigle-grahammcculloch.c9.io/](https://gigle-grahammcculloch.c9.io/)