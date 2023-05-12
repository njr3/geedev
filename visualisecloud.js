// Define the dates of the imagery to be used
var startDate = '2023-01-01';
var endDate = '2023-12-31';

// Load the Sentinel-2 Cloudless imagery
var s2c = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY')
  .filterDate(startDate, endDate)
  .filterBounds(geometry);

// Define a function to mask clouds using the Sentinel-2 Cloudless product
function maskclouds(image) {
  var cloudMask = image.select('probability').lt(20);
  return image.updateMask(cloudMask)
      .select("probability")
      .copyProperties(image, ["system:time_start"]);
}

// Apply the cloud mask function to the image collection
var filtered = s2c.map(maskclouds);

// Visualize the cloud mask imagery
var visParams = {min: 0, max: 100};
var firstImage = ee.Image(filtered.first());
Map.addLayer(firstImage, visParams, 'S2 Cloudless Mask');

// Center the map on the region of interest and set the zoom level
Map.centerObject(geometry, 10);
