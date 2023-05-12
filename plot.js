// Define the dates of the imagery to be used
var startDate = '2022-11-01';
var endDate = '2023-04-15';

// Load the Sentinel-2 imagery
var collection = ee.ImageCollection('COPERNICUS/S2_SR')
  .filterDate(startDate, endDate)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
  .filterBounds(geometry);
print(collection)
var medianpixels = collection.median()
var medianpixelsclipped = medianpixels.clip(geometry).divide(10000)
Map.addLayer(medianpixelsclipped, {bands: ['B8', 'B4', 'B3'], min: 0, max: 1, gamma: 1.4, }, 'Sentinel_2 mosaic') 
Map.centerObject(geometry)
var bands = ['B2','B3','B4','B5','B6','B8','B9',]; 
var nir = medianpixelsclipped.select('B5');
var red = medianpixelsclipped.select('B4');
var ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI');
var ndviParams = {min: -1, max: 1, palette: ['blue', 'white', 'green','pink', 'red', 'yellow','blue', 'white', 'green', 'black']};
medianpixelsclipped = medianpixelsclipped.addBands(ndvi);

