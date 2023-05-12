// Define the dates of the imagery to be used
var startDate = '2023-01-01';
var endDate = '2023-04-15';
// Load the Sentinel-2 imagery
var filtered = ee.ImageCollection('COPERNICUS/S2_SR')
  .filterDate(startDate, endDate)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
  .filterBounds(geometry);
print(filtered)

function maskclouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(
             qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask)//.divide(10000)
      .select("B.*")
      .copyProperties(image, ["system:time_start"]);
}

var filtered = filtered.map(maskclouds);
function computeNDVI(image) {
  var ndvi = image.normalizedDifference(['B8', 'B4']).rename('ndvi');
  return image.addBands(ndvi);
}


var withNdvi = filtered.map(computeNDVI);


var chart = ui.Chart.image.series({
  imageCollection: withNdvi.select('ndvi'),
  region: geometry,
  reducer: ee.Reducer.mean(),
  scale: 20
}).setOptions({
      lineWidth: 1,
      title: 'NDVI Time Series',
      interpolateNulls: true,
      vAxis: {title: 'NDVI'},
      hAxis: {title: '', format: 'YYYY-MMM'}
    });
print(chart);