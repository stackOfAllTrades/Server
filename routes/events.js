const express = require('express');
const router = express.Router();
const knex = require('../db/connection');
const posting = require("../functions/posting");
const scrape = require("../functions/scrape");


router.get('/', (req, res, next) => {
    let ddWasScrapedToday = true;
    let wwWasScrapedToday = true;
    let meetupWasScrapedToday = true;
    let ddNeedsUpdate = false;
    let wwNeedsUpdate = false;
    let meetupNeedsUpdate = false;
    scrape.scrapeTodayCheck()
        .then((resultsArray) => {
            ddWasScrapedToday = resultsArray[0];
            wwWasScrapedToday = resultsArray[1];
            meetupWasScrapedToday = resultsArray[2];
            if (ddWasScrapedToday === false) {
                ddWasScrapedToday = true;
                ddNeedsUpdate = true;
                return scrape.dearDenver();
            } else {
                return {
                    message: "was already scraped today"
                };
            }
        })
        .then((ddReturnObject) => {
            if (ddReturnObject.message) {
                return ddReturnObject;
            } else {
                if (ddReturnObject.eventArray.length > 0) {
                    const ddPostObject = ddReturnObject.eventArray;
                    return posting.postToDB(ddPostObject);
                } else {
                    return {
                        message: "returned an empty array"
                    };
                }
            }
        })
        .then((result) => {
            console.log("Dear Denver: " + result.message);
        })
        .then(() => {
            if (wwWasScrapedToday === false) {
                wwWasScrapedToday = true;
                wwNeedsUpdate = true;
                return scrape.westWord();
            } else {
                return {
                    message: 'was already scraped today'
                }
            }
        })
        .then((wwReturnObject) => {
            if (wwReturnObject.message) {
                return wwReturnObject;
            } else {
                if (wwReturnObject.eventArray !== null) {
                    const wwPostObject = wwReturnObject.eventArray;
                    return posting.postToDB(wwPostObject);
                } else {
                    return {
                        message: "returned null"
                    };
                }
            }
        })
        .then((result) => {
            console.log("WestWord: " + result.message);
        })
        .then(() => {
            if (meetupWasScrapedToday === false) {
                meetupWasScrapedToday = true;
                meetupNeedsUpdate = true;
                return scrape.meetup();
            } else {
                return {
                    message: "was already scraped today"
                }
            }
        })
        .then((meetupReturnObject) => {
            if (meetupReturnObject.message) {
                return meetupReturnObject;
            } else {
                if (meetupReturnObject.eventArray !== null) {
                    const meetupPostObject = meetupReturnObject.eventArray;
                    return posting.postToDB(meetupPostObject);
                } else {
                    return {
                        message: "returned null"
                    };
                }
            }
        })
        .then((result) => {
            console.log("Meetup: " + result.message);
        })
        .then(() => {
            return knex('event')
                .select()
        })
        .then(data => {
            res.json(data);
        })
        .then(() => {
            if (ddNeedsUpdate === true) {
                return scrape.markTodayChecked("Dear Denver");
            }
        })
        .then((updatedDate) => {
            if (updatedDate) {
                console.log("Dear Denver was scraped today, on: " + updatedDate[0]);
            } else {
                console.log("Nothing came back from DD");
            }

            if (wwNeedsUpdate === true) {
                return scrape.markTodayChecked("WestWord");
            }
        })
        .then((updatedDate) => {
            if (updatedDate) {
                console.log("WestWord was scraped today, on: " + updatedDate[0]);
            } else {
                console.log("Nothing came back from WW");
            }
        })
        .then(()=>{
          if(meetupNeedsUpdate === true){
            return scrape.markTodayChecked("Meetup");
          }
        })
        .then((updatedDate)=>{
          if(updatedDate){
            console.log("Meetup was scraped today, on: " + updatedDate[0])
          }
          else{
            console.log("Nothing came back from Meetup")
          }
        })
        .catch(function(err) {
            next(err);
        });



});

router.get('/existing', (req, res, next) => {
    return knex('event')
        .select()
        .then(data => {
            res.json(data);
        })
        .catch(function(err) {
            next(err);
        });
});

router.get('/meetup', (req, res, next) => {
    scrape.meetup()
        .then((result) => {
            res.json(result);
        })
});

router.post('/', function(req, res, next) {
    const eventArray = req.body.eventArray;
    // console.log(eventArray);
    posting.postToDB(eventArray)
        .then((result) => {
            res.json(result);
        })
        .catch(function(err) {
            next(err);
        });

});

// knex('/scrape/deardenver').insert({
//     sourceName: req.body.sourceName,
//     eventLink: req.body.eventLink,
//     description: req.body.description,
//     date: req.body.date,
//     time: req.body.time,
//     eventName: req.body.eventName,
// }).then(data => {
//     res.json(data);
// });

module.exports = router;
