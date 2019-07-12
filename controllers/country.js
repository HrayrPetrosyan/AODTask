const http = require('http');

const Country = require('../models/country');
const Region = require('../models/region');
const City = require('../models/city');

const getCountryAPI = (options, cb) => {
  http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      let countryAPI = JSON.parse(body);
      countryAPI = countryAPI[0];
      cb(null, countryAPI);
    });
    res.on('error', cb);
  })
  .on('error', cb)
  .end();
};

const options = (countryFullName) => {
  return {
    host: 'restcountries.eu',
    port: 80,
    path: `/rest/v2/name/${countryFullName}?fullText=true`,
    method: 'GET'
  };
};

const saveRegionIfNotExist = (countryAPI, cb) => {
  Region.findOne({name: countryAPI.region})
    .then(regionData => {
      if(!regionData){
        const region = new Region({
          name: countryAPI.region
        });
        region.save()
          .then(newRegionData => {
            cb(countryAPI, newRegionData._id);
          })
          .catch(err => {
            res.status(500).json({
              message: "Region saving failed"
            })
            throw Error(err)
          });
      } else {
        cb(countryAPI, regionData._id);
      }
    });  
}

exports.fetchCountries = (req, res, next) => {
  Country.find({})
    .then(countries => {
      res.status(200).json({
        countries: countries,
        message: 'Countries successfully fetched'
      });
    })
    .catch(err => {
      res.status(500).json({
        message: "Failed to fetch countries"
      });
      throw Error(err);
    })
};

exports.fetchCountry = (req, res, next) => {
  const countryId = req.params.countryId;
  Country.findById(countryId)
    .then(country => {
      if (!country) {
        res.status(404).json({
          message: 'Id doesn\'t exist'
        })
      }
      res.status(200).json({
        country: country,
        message: 'Country fetched successfully'
      })
    })
    .catch(error => {
      res.status(500).json({
        message: 'Fetching Country failed'
      });
      throw Error(error);
    })
}

exports.addCountry = (req, res, next) => {
  const countryFullName = req.body.countryFullName;
  if(!countryFullName){
    res.status(400).json({
      message: 'Country name is not provided'
    });
  };
  const saveCountryAndCity = (countryAPI, regionId) => {
    // is there Country with given name?
    Country.findOne({name: countryAPI.name})
      .then(countryDataArray => {
        if (countryDataArray) {
          res.status(400).json({
            message: 'Country already exists'
          });
        } else {
          const country = new Country({
            name: countryAPI.name,
            alpha2Code: countryAPI.alpha2Code,
            alpha3Code: countryAPI.alpha3Code,
            population: countryAPI.population,
            latlng: countryAPI.latlng,
            area: countryAPI.area,
            region: regionId,
            cities: []
          });
          const capCity = new City({
            name: countryAPI.capital,
            timezones: countryAPI.timezones,
            isCapital: true,
            country: country._id
          });
          country.cities.push(capCity._id);
          // There isn't, saving a new Country is allowed  
          // Saving the Capital as a City 
          capCity.save()
            .then(capCityData => {
              country.save()
                .then(() => {
                  res.status(201).json({
                    message: "Country successfully added"
                  })       
                })
                .catch(err => {
                  res.status(500).json({
                    message: "Saving Country failed"
                  });
                  throw Error(err);
                });
            })
            .catch(err => {
              res.status(500).json({
                message: "Saving Capital City failed"
              });
              throw Error(err);     
            })
            
        }
      })
      .catch(err => {
        res.status(500).json({
          message: "Failed to find Country"
        });
        throw Error(err);   
      })
  };

  getCountryAPI(options(countryFullName), (err, countryAPI) => {
    if(err){
      return console.log('Error while trying to post a country ', err);
    };
    try {
      if(countryAPI.name) {
        saveRegionIfNotExist(countryAPI, saveCountryAndCity); 
      }
    } catch (error) {
      res.status(400).json({
        message: "Country not found. Provide the full name, please!"
      });
    }
  });
};

exports.updateCountry = (req, res, next) => {
  const countryId = req.params.countryId;
  const updatedCountryName = req.body.updatedCountryName;

  const updateCountryAndCity = (countryAPI, regionId) => {
    const updatedCountry = ({
      name: countryAPI.name,
      alpha2Code: countryAPI.alpha2Code,
      alpha3Code: countryAPI.alpha3Code,
      population: countryAPI.population,
      latlng: countryAPI.latlng,
      area: countryAPI.area,
      region: regionId,
      cities: []
    });
    const capCity = new City({
      name: countryAPI.capital,
      timezones: countryAPI.timezones,
      isCapital: true,
      country: countryId
    });
    updatedCountry.cities.push(capCity._id);
    capCity.save()
      .then(capCityData => {
        Country.findByIdAndUpdate(countryId, updatedCountry)
          .then(updatedCountryData => {
            res.status(201).json({
              message: 'Country successfully updated'
            });
          })
          .catch(error => {
            res.status(500).json({
              message: 'Failed to update the Country'
            });
            throw Error(error);
          })
      })
      .catch(error => {
        res.status(500).json({
          message: 'Failed to save Capital'
        });
        throw Error(error);
      })
  }

  City.deleteMany({country: countryId})
  .then(() => {
    Country.findById(countryId)
      .then(countryData => {
        if (!countryData) {
          // countryId param is not valid
          res.status(404).json({
            message: "Country with given id is not found!"
          });
        } else {
          getCountryAPI(options(updatedCountryName), (err, countryAPI) => {
            if(err){
              return console.log('Error while trying to post a country ', err);
            };
            try {
              if(countryAPI.name){
                Country.findOne({name: updatedCountryName})
                  .then(updatedCountryExists => {
                    if (updatedCountryExists) {
                      res.status(400).json({
                        message: 'The new Country already exists'
                      });
                    } else {
                      saveRegionIfNotExist(countryAPI, updateCountryAndCity);                  
                    }
                  })
                  .catch(error => {
                    res.status(500).json({
                      message: 'Failed to find the country in DB'
                    });
                    throw Error(error);
                  })
              }
            } catch (error) {
              res.status(400).json({
                message: "Given name is not a name of a Country!"
              });
            }
          });
        }
      })
      .catch(err => {
        res.status(500).json({
          message: "Country with given name failed to find!"
        });
        throw Error(err);
      });
    })
  .catch(error => {
    res.status(404).json({
      message: 'Country id doesn\'t exist'
    });
  })
};

exports.deleteCountry = (req, res, next) => {
  const countryId = req.query.id;
  City.deleteMany({country: countryId})
  .then(data => {
    Country.findByIdAndDelete(countryId)
      .then(data => {
        if(!data){
          return res.status(404).json({
            message: 'Country id doesn\'t exist'
          });
        }
        res.status(200).json({
          message: 'Country successfully deleted'
        })
      })
      .catch(error => {
        res.status(500).json({
          message: 'Country delete failed'
        });
        throw Error(error);
      })
  })
  .catch(error => {
    res.status(500).json({
      message: 'City delete failed'
    });
    throw Error(error);
  })

  
}