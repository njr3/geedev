var shapefile = ee.FeatureCollection("projects/ee-nteupejoelrostand/assets/plot_2023_shape");

// Create a single geometry that encompasses all the polygons in the shapefile
// var geometry = shapefile.first().geometry().union();
// Loop through the features in the shapefile collection and combine their geometries
// Loop through the features in the shapefile collection and combine their geometries
// Merge the geometries of all features in the collection
// var mergedGeometry = shapefile.geometry().union();
// var geometry = mergedGeometry.bounds();


// Define the dates of the imagery to be used
var startDate = '2022-11-01';
var endDate = '2023-04-15';

// Load the Sentinel-2 imagery
var s2 = ee.ImageCollection('COPERNICUS/S2_SR')
  .filterDate(startDate, endDate)
  .filterBounds(geometry);

// Define a function to extract the pixel values for each polygon
var extractPixelValues = function(feature) {
  // Get the polygon's ID
  var id = feature.get('ID');
  
  // Extract the pixel values for each image in the collection
  var values = s2.map(function(image) {
    // Get the date of the image
    var date = ee.Date(image.get('system:time_start')).format('YYYY-MM-dd');
    
    // Reduce the image to the polygon and get the mean value
    var value = image.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: feature.geometry(),
      scale: 10,
      maxPixels: 1e13
    }).getNumber('B2');
    
    // Return the date and value as a feature
    return ee.Feature(null, {
      'date': date,
      'pixel_value': value,
      'id': id
    });
  });
  
  // Return the features as a single FeatureCollection
  return ee.FeatureCollection(values);
};

// Map the function over the shapefile to get the pixel values for each polygon
var pixelValues = shapefile.map(extractPixelValues).flatten();

// Export the pixel values as a CSV file
//Export.table.toDrive({
  //collection: pixelValues,
  //description: 'Pixel_Values',
  //fileFormat: 'CSV'
//});


Export.table.toDrive({
  collection: pixelValues,
  description: 'Pixel_Values_Horizontal',
  fileFormat: 'GeoJSON'
});