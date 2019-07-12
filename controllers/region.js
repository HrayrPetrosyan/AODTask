const http = require('http');

const Region = require('../models/region');

const getRegionAPI = (options, cb) => {
  http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      let regionAPI = JSON.parse(body);
      cb(null, regionAPI);
    });
    res.on('error', cb);
  })
  .on('error', cb)
  .end();
};

const options = (regionName) => {
  return {
    host: 'restcountries.eu',
    port: 80,
    path: `/rest/v2/region/${regionName}`,
    method: 'GET'
  };
};

exports.fetchRegions = (req, res, next) => {
  Region.find({})
    .then(regions => {
      res.status(200).json({
        regions: regions,
        message: 'Regions successfully fetched'
      });
    })
    .catch(err => {
      res.status(500).json({
        message: "Failed to fetch regions"
      });
      throw Error(err);
    })
};

exports.fetchRegion = (req, res, next) => {
  const regionId = req.params.regionId;
  Region.findById(regionId)
    .then(region => {
      if (!region) {
        return res.status(404).json({
          message: 'Region with provided id does\'t exist'
        });
      }
      res.status(200).json({
        region: region,
        message: 'Region successfully fetched'
      });
    })
    .catch(err => {
      res.status(400).json({
        message: 'Region with provided id does\'t exist'
      });
    })
}

exports.addRegion = (req, res, next) => {
  const regionName = req.body.regionName;
  getRegionAPI(options(regionName), (err, regionApi) => {
    if(err){
      return console.log('Error while trying to fetch a region api ', err);
    };  
    if (!regionApi.status) {
      Region.findOne({name: regionName})
        .then(regionExists => {
          if(regionExists){
            return res.status(400).json({
              message: 'Region already exists'
            })
          };
          const region = new Region({
            name: regionName
          });
          region.save()
            .then(() => {
              res.status(201).json({
                message: 'Region added successfully'
              });
            })
            .catch(error => {
              res.status(500).json({
                message: 'Failed to save a region'
              });
              throw Error(error);
            }) 
        })
        .catch(error => {
          res.status(500).json({
            message: 'Failed to save a region'
          });
          throw Error(error);
        })
    } else {
      res.status(404).json({
        message: 'Region with provided name does\'t exist!'
      });
    }
  });
};

exports.updateRegion = (req, res, next) => {
  const regionName = req.body.regionName;
  const newRegionName = req.body.newRegionName;
  Region.find({name: regionName})
    .then(regionData => {
      if(!regionData){
        return res.status(404).json({
          message: 'Provided Region name doesn\'t exist on DB'
        })
      }
      getRegionAPI(options(newRegionName), (err, newRegionApi) => {
        if(err){
          return console.log('Error while trying to fetch a region api ', err);
        };
        if (!newRegionApi.status) {
          Region.findOne({name: newRegionName})
            .then(newRegionDataExists => {
              if(newRegionDataExists){
                return res.status(400).json({
                  message: 'The new Region already exists'
                });
              };
              Region.findOneAndUpdate({name: regionName}, {name: newRegionName})
                .then(data => {
                  if (!data) {
                    return res.status(404).json({
                      message: 'Region does\'t exist'
                    });
                  }
                  res.status(201).json({
                    message: 'Region updated'
                  });
                })
                .catch(error => {
                  res.status(500).json({
                    message: 'Failed to update the Region'
                  });
                  throw Error(error);
                })
            })
            .catch(error => {
              res.status(500).json({
                message: 'Failed to fetch a new Region from DB'
              });
              throw Error(error);
            })
        } else {
          res.status(404).json({
            message: 'Region with the new name does\'t exist!'
          });
        }
      })
    })
    .catch(error => {
      res.status(500).json({
        message: 'Failed to find the region'
      });
      throw Error(error);
    });
};

exports.deleteRegion = (req, res, next) => {
  const regionId = req.params.regionId;
  Region.findByIdAndDelete(regionId)
    .then(region => {
      if (!region) {
        return res.status(404).json({
          message: 'Region with provided id does\'t exist'
        });
      }
      res.status(200).json({
        message: 'Region successfully deleted'
      })
    })
    .catch(error => {
      res.status(500).json({
        message: 'Failed to find a region with provided id'
      });
      throw Error(error);
    });
}

