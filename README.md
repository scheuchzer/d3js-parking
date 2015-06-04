# d3js-parking


## Convert data from GeoJSON to TopoJSON

Install the tool:
```
npm install -g topojson

```

Convert the data:
```
topojson -o t.json -p Kname app/stadtkreis.json
```

## Parking lookup

http://maps.google.com/maps/api/geocode/json?address=Beethovenstrasse%2035,%20Z%C3%BCrich