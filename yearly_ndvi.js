//define study area and dates
var study_area = ee.Geometry.Rectangle([
    [-8.757320, 39.854857],
    [-8.427730, 40.050665]]);
var date_start = ee.Date('2020-01-01');
var date_end= ee.Date('2020-12-31');
//center Map
var long = ee.Number(study_area.centroid()
.coordinates().get(0)).getInfo();
var lat = ee.Number(study_area.centroid()
.coordinates().get(1)).getInfo();
Map.setCenter(long,lat,11);
//define collection
var S2 = ee.ImageCollection("COPERNICUS/S2_SR")
.filterBounds(study_area)        
.filterDate(date_start.advance(-1,'year'),date_end);


//apply cloud mask
function filterS2_level2A(image) {
    var SCL = image.select('SCL');
    var mask01 = ee.Image(0).where(
        SCL.lt(8).and(SCL.gt(3)) ,1); //Put a 1 on good pixels
    return image.updateMask(mask01);
  }
  var S2filtered= S2.map(filterS2_level2A);

  //compute ndvi
function addNDVI(image) {
    var ndvi = image.normalizedDifference(['B8','B4'])
                    .multiply(10000).int16();
    return image.addBands(ndvi.rename('ndvi'));
  }
  var S2filtered = S2filtered.map(addNDVI);
  //select bands of interest (NDVI only)
  var S2filtered = S2filtered.select('ndvi');
  //clip collection to study area
  var S2_clipped = S2filtered.map(function(img){ 
                      return img.clip(study_area)});

//create list of months from 1 to 12
var months = ee.List.sequence(1, 12);
//separate by years
var years = ee.List.sequence(date_start.advance(-1,"year")
                                       .get("year"),
                             date_end.get("year"));
//compute median value per month
var composite = years.map(function (y) {
     return ee.ImageCollection.fromImages(months.map(function (m) {
      return S2_clipped.filter(ee.Filter.calendarRange(y,y,'year'))
                       .filter(ee.Filter.calendarRange(m,m,'month'))
                       .median()
                       .set('month',m, 'year',y);
    }))
  });
//decompose list of img collection into list of images
function decomposeList(l) {
    return ee.ImageCollection(l).toList(12)
  }
  var list_imgs = composite.map(decomposeList).flatten();
  //set system id and system index according to year and month
  function renameImages(img1) {
    var img = ee.Image(img1);
    var value = ee.Number(img.get('year')).format('%04d')
            .cat('_').cat(ee.Number(img.get('month')).format('%02d'));
    return ee.Image(img.set('system:index', value, 'system:id',value))
  }
  var list_imgs_renamed = list_imgs.map(renameImages);
  //convert from list to img collection
  var decomposed_collection = ee.ImageCollection(list_imgs_renamed);       