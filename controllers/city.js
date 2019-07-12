const City = require('../models/city');
const Country = require('../models/country');

exports.fetchCities = (req, res, next) => {
  City.find({})
    .then(cities => {
      if (!cities) {
        return res.status(404).json({
          message: 'No cities on DB'
        });
      };
      res.status(200).json({
        cities: cities,
        message: 'Cities fetched successfully'
      })
    })
    .catch(error => {
      res.status(500).json({
        message: 'Failed to fetch cities'
      });
      throw Error(error);
    })
};

exports.fetchCity = (req, res, next) => {
  const cityId = req.params.cityId;
  City.findById(cityId)
    .then(cityData => {
      if (!cityData) {
        return res.status(404).json({
          message: 'City with provided id does\'t exist'
        })
      };
      res.status(200).json({
        city: cityData,
        message: 'City fetched successfully'
      })
    })
    .catch(error => {
      res.status(500).json({
        message: 'Failed to fetch the City'
      });
      throw Error(error);
    })
};

exports.addCity = (req, res, next) => {
  const cityName = req.body.cityName;
  const countryName = req.body.countryName;
  Country.findOne({name: countryName})
    .then(country => {
      if (!country) {
        return res.status(404).json({
          message: 'No Country with the provided name found on DB'
        });
      };
      City.findOne({name: cityName})
        .then(cityExists => {
          if (cityExists) {
            return res.status(400).json({
              message: 'City with given name already exists'
            });
          };
          City.findOne({country: country._id, isCapital: true})
            .then(capitalCity => {
              const city = new City({
                name: cityName,
                timezones: capitalCity.timezones,
                isCapital: false,
                country: country._id
              });
              country.cities.push(city._id);
              country.save()
                .then(countryData => {
                  city.save()
                    .then(cityData => {
                      res.status(201).json({
                        message: 'City added successfully'
                      })
                    })
                    .catch(error => {
                      res.status(500).json({
                        message: 'Failed to save the City'
                      });
                      throw Error(error);
                    })
                })
                .catch(error => {
                  res.status(500).json({
                    message: 'Failed to save the Country'
                  });
                  throw Error(error);
                })
            })
            .catch(error => {
              res.status(500).json({
                message: 'Failed to find the Capital'
              });
              throw Error(error);
            })
        })
        .catch(error => {
          res.status(500).json({
            message: 'Failed to fetch the City'
          });
          throw Error(error);
        })      
    })
    .catch(error => {
      res.status(500).json({
        message: 'Failed to fetch the country'
      });
      throw Error(error);
    })
};

exports.updateCity = (req, res, next) => {
  const cityId = req.params.cityId;
  const updatingCityName = req.body.updatingCityName;
  const updatingCountryName = req.body.updatingCountryName;
  // Updated City already exists?
  City.findOne({name: updatingCityName})
    .then(updatingCityExists => {
      if (updatingCityExists) {
        return res.status(400).json({
          message: 'City with given name already exists'
        });
      };
      // City id exists? delete from the Country Cities list if exists
      City.findById(cityId)
        // populate city.country.cities
        .populate('country', 'cities')
        .then(cityWithCountryCitiesData => {
          if (!cityWithCountryCitiesData) {
            return res.status(404).json({
              message: 'City with provided id does\'t exist'
            });
          };
          if (cityWithCountryCitiesData.isCapital){
            return res.status(403).json({
              message: 'The City is a capital. Updating is not allowed'
            });
          };
          const citiesArray = cityWithCountryCitiesData.country.cities.filter(cityIdinArray => {
            return cityIdinArray != cityId
          });
          cityWithCountryCitiesData.country.cities = citiesArray;
          // saving the country with the cities array with old city deleted
          cityWithCountryCitiesData.country.save()
            .then(countryData => {
              // Updated Country exists? if exists push the new city to the Cities array
              Country.findOne({name: updatingCountryName})
              .populate({path: 'cities', populate: {path: 'cities'}})
              .then(countryWithCitiesData => {
                if(!countryWithCitiesData){
                  return res.status(404).json({
                    message: 'Country with provided name doesn\'t exist on DB'
                  })
                };
                // timezone for the new city
                const updatingCityTimeZone = countryWithCitiesData.cities[0].timezones;
                const cityIdsArray = [cityId];
                countryWithCitiesData.cities.forEach(city => {
                  cityIdsArray.push(city._id)
                });
                countryWithCitiesData.cities = cityIdsArray;
                countryWithCitiesData.save()
                  .then(updatedCountryData => {
                    const updatedCity = {
                      name: updatingCityName,
                      timezones: updatingCityTimeZone,
                      isCapital: false,
                      country: updatedCountryData._id
                    }
                    City.findByIdAndUpdate(cityId, updatedCity)
                      .then(updatedCityData => {
                        res.status(201).json({
                          message: 'City updated successfully'
                        })
                      })
                      .catch(error => {
                        res.status(500).json({
                          message: 'Failed to update the city on DB'
                        });
                        throw Error(error);
                      })
                  })
                  .catch(error => {
                    res.status(500).json({
                      message: 'Failed save the updated country with the new city added on DB'
                    });
                    throw Error(error);
                  })
            })
            .catch(error => {
              res.status(500).json({
                message: 'Failed save the country with the city deleted on DB'
              });
              throw Error(error);
            })
        })
        .catch(error => {
          res.status(500).json({
            message: 'Failed to find a city with given id on DB'
          });
          throw Error(error);
        })
      })
      .catch(error => {
        res.status(500).json({
          message: 'Provided id is not valid'
        });
        throw Error(error);
      }) 
    })
    .catch(error => {
      res.status(500).json({
        message: 'Failed to find a city with given id'
      });
      throw Error(error);
    })   
};

exports.deleteCity = (req, res, next) => {
  const cityId = req.params.cityId;
  City.findById(cityId)
    .populate('country', 'cities')
    .then(cityData => {
      if (!cityData) {
        return res.status(404).json({
          message: 'City with provided id doesn\'t exist'
        })
      };
      if (cityData.isCapital) {
        return res.status(403).json({
          message: 'The City is a capital. Deleting is not allowed!'
        });
      };
      const citiesWithDeletedCity = cityData.country.cities.filter(city => {
        return city != cityId;
      });
      cityData.country.cities = citiesWithDeletedCity;
      cityData.country.save()
        .then(countryData => {
          cityData.remove()
            .then(data => {
              res.status(200).json({
                message: 'City deleted successfully'
              });
            })
            .catch(error => {
              res.status(500).json({
                message: 'Failed to remove the city'
              });
              throw Error(error);
            })
        })
        .catch(error => {
          res.status(500).json({
            message: 'Failed to save the country'
          });
          throw Error(error);
        })
    })
    .catch(error => {
      res.status(500).json({
        message: 'Failed to find the city'
      });
      throw Error(error);
    })
};
