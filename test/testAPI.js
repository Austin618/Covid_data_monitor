let chai = require("chai");
let chaiHttp = require("chai-http");
let server = require("../server.js");
// import server from "../server.js";

// Assertion Style
chai.should();

chai.use(chaiHttp);

describe("Test GET /", () => {
    it("Check connection",(done)=>{
        chai.request(server)
            .get("/")
            .end((err, response) => {
                response.should.have.status(200);
                done();
            })
    })
})

describe('Test time_series API', () => {
    // active = confirmed - recovered - deaths
    const table_confirmed =
        "Province/State,Country/Region,Lat,Long,1/22/20,1/23/20\n" +
        ",Afghanistan,33.93911,67.709953,0,0\n" +
        ",Albania,41.1533,20.1683,0,0";

    const table_confirmed_update =
        "Province/State,Country/Region,Lat,Long,1/22/20,1/23/20\n" +
        "Wallis and Futuna,France,-14.2938,-178.1165,0,0\n" +
        ",Algeria,28.0339,1.6596,6,8\n" +
        ",Afghanistan,33.93911,67.709953,9,7\n" +
        ",Fiji,-17.7134,178.065,0,0\n" +
        ",Albania,41.1533,20.1683,11,5\n" +
        "Australian Capital Territory,Australia,-35.4735,149.0124,9,8\n" +
        "New South Wales,Australia,-33.8688,151.2093,9,10";

    const table_deaths =
        "Province/State,Country/Region,Lat,Long,1/22/20,1/23/20\n" +
        ",Afghanistan,33.93911,67.709953,0,0\n" +
        ",Albania,41.1533,20.1683,0,0";

    const table_deaths_update =
        "Province/State,Country/Region,Lat,Long,1/22/20,1/23/20\n" +
        ",Afghanistan,33.93911,67.709953,3,1\n" +
        "Australian Capital Territory,Australia,-35.4735,149.0124,4,1\n" +
        ",Algeria,28.0339,1.6596,1,3\n" +
        ",Guyana,4.860416,-58.93018,0,0\n" +
        ",Holy See,41.9029,12.4534,0,0\n" +
        ",Albania,41.1533,20.1683,2,0\n" +
        "New South Wales,Australia,-33.8688,151.2093,2,5";

    const table_recovered =
        "Province/State,Country/Region,Lat,Long,1/22/20,1/23/20\n" +
        ",Afghanistan,33.93911,67.709953,0,0\n" +
        ",Albania,41.1533,20.1683,0,0";

    const table_recovered_update =
        "Province/State,Country/Region,Lat,Long,1/22/20,1/23/20\n" +
        "\"Saint Helena, Ascension and Tristan da Cunha\",United Kingdom,-7.9467,-14.3559,0,0\n" +
        ",Afghanistan,33.93911,67.709953,1,1\n" +
        ",Algeria,28.0339,1.6596,0,0\n" +
        ",Kuwait,29.31166,47.481766,0,0\n" +
        "Australian Capital Territory,Australia,-35.4735,149.0124,0,2\n" +
        ",Albania,41.1533,20.1683,4,2\n" +
        "New South Wales,Australia,-33.8688,151.2093,2,0";

    const table_active_update =
        "Province/State,Country/Region,Lat,Long,1/22/20,1/23/20\n" +
        ",Afghanistan,33.93911,67.709953,5,5\n" +
        ",Algeria,28.0339,1.6596,5,5\n" +
        "Australian Capital Territory,Australia,-35.4735,149.0124,5,5\n" +
        ",Albania,41.1533,20.1683,5,3\n" +
        "New South Wales,Australia,-33.8688,151.2093,5,5";

    const table_extra_columns =
        "Province/State,Country/Region,Lat,Long,1/22/20,1/23/20,1/24/20\n" +
        ",Afghanistan,33.93911,67.709953,0,0,0\n" +
        ",Albania,41.1533,20.1683,0,0,0";

    const table_different_columns =
        "Province/State,Country/Region,Lat,Long,1/23/20,1/24/20\n" +
        ",Afghanistan,33.93911,67.709953,0,0,0\n" +
        ",Albania,41.1533,20.1683,0,0,0";

    const table_extra_data =
        "Province/State,Country/Region,Lat,Long,1/22/20,1/23/20\n" +
        ",Afghanistan,33.93911,67.709953,0,0,0\n" +
        ",Albania,41.1533,20.1683,0,0,0";

    // At first, database contain no files, so GET request must return 400
    describe("Test GET /time_series/time_series_name1/:data_type", () => {
        it("GET /time_series/time_series_name1/confirmed should return status 400",(done)=>{
            chai.request(server)
                .get("/time_series/time_series_name1/confirmed")
                .end((err, response) => {
                response.should.have.status(400);
                response.body.should.equal("Malformed request");
                done();
                })
        })

        it("GET /time_series/time_series_name1/recovered should return status 400",(done)=>{
            chai.request(server)
                .get("/time_series/time_series_name1/recovered")
                .end((err, response) => {
                    response.should.have.status(400);
                    response.body.should.equal("Malformed request");
                    done();
                })
        })

        it("GET /time_series/time_series_name1/deaths should return status 400",(done)=>{
            chai.request(server)
                .get("/time_series/time_series_name1/deaths")
                .end((err, response) => {
                    response.should.have.status(400);
                    response.body.should.equal("Malformed request");
                    done();
                })
        })

        it("GET /time_series/time_series_name1/active should return status 400",(done)=>{
            chai.request(server)
                .get("/time_series/time_series_name1/active")
                .end((err, response) => {
                    response.should.have.status(400);
                    response.body.should.equal("Malformed request");
                    done();
                })
        })
    })

    // At first, database contain no files, so DELETE request must return 404
    describe("Test DELETE /time_series/time_series_name1", () => {
        it("It should return status 404 since any one of files (time_series_name1_confirmed, time_series_name1_confirmed," +
            " time_series_name1_confirmed) does not exist", (done)=>{
            chai.request(server).delete("/time_series/time_series_name1").end((err, response) => {
                response.should.have.status(404);
                response.body.should.equal("Time series not found");
                done();
            })
        })
    })

    // Then, POST /time_series/time_series_name1/confirmed with some example data
    describe("Test POST /time_series/time_series_name1/:data_type", () => {
        it("It should POST the table time_series_name1_confirmed and create new table with status 200",(done)=>{
            chai.request(server)
                .post("/time_series/time_series_name1/confirmed")
                .set('content-type', 'text/plain')
                .send(table_confirmed)
                .end((err, response) => {
                    response.should.have.status(200);
                    response.body.should.equal("Uploaded successful");
                    done();
                })
        })

        it("It should POST the table time_series_name1_confirmed update data with status 200",(done)=>{
            chai.request(server)
                .post("/time_series/time_series_name1/confirmed")
                .set('content-type', 'text/plain')
                .send(table_confirmed_update)
                .end((err, response) => {
                    response.should.have.status(200);
                    response.body.should.equal("Updated successful");
                    done();
                })
        })

        it("It should POST the table time_series_name1_deaths and create new table with status 200",(done)=>{
            chai.request(server)
                .post("/time_series/time_series_name1/deaths")
                .set('content-type', 'text/plain')
                .send(table_deaths)
                .end((err, response) => {
                    response.should.have.status(200);
                    response.body.should.equal("Uploaded successful");
                    done();
                })
        })

        it("It should POST the table time_series_name1_deaths update data with status 200",(done)=>{
            chai.request(server)
                .post("/time_series/time_series_name1/deaths")
                .set('content-type', 'text/plain')
                .send(table_deaths_update)
                .end((err, response) => {
                    response.should.have.status(200);
                    response.body.should.equal("Updated successful");
                    done();
                })
        })

        it("It should POST the table time_series_name1_recovered and create new table with status 200",(done)=>{
            chai.request(server)
                .post("/time_series/time_series_name1/recovered")
                .set('content-type', 'text/plain')
                .send(table_recovered)
                .end((err, response) => {
                    response.should.have.status(200);
                    response.body.should.equal("Uploaded successful");
                    done();
                })
        })

        it("It should POST the table time_series_name1_recovered update data with status 200",(done)=>{
            chai.request(server)
                .post("/time_series/time_series_name1/recovered")
                .set('content-type', 'text/plain')
                .send(table_recovered_update)
                .end((err, response) => {
                    response.should.have.status(200);
                    response.body.should.equal("Updated successful");
                    done();
                })
        })

        it("It should POST return status 400 since Malformed request",(done)=>{
            chai.request(server)
                .post("/time_series/time_series_name1/active")
                .set('content-type', 'text/plain')
                .send(table_confirmed_update)
                .end((err, response) => {
                    response.should.have.status(400);
                    response.body.should.equal("Malformed request");
                    done();
                })
        })

        it("It should POST return status 422 since Invalid file contents",(done)=>{
            chai.request(server)
                .post("/time_series/time_series_name1/confirmed")
                .set('content-type', 'text/plain')
                .send("")
                .end((err, response) => {
                    response.should.have.status(422);
                    response.body.should.equal("Invalid file contents");
                    done();
                })
        })

        it("It should POST return status 422 since Invalid file contents",(done)=>{
            chai.request(server)
                .post("/time_series/time_series_name1/confirmed")
                .set('content-type', 'text/plain')
                .send(table_extra_columns)
                .end((err, response) => {
                    response.should.have.status(422);
                    response.body.should.equal("Invalid file contents");
                    done();
                })
        })

        it("It should POST return status 422 since Invalid file contents",(done)=>{
            chai.request(server)
                .post("/time_series/time_series_name1/confirmed")
                .set('content-type', 'text/plain')
                .send(table_different_columns)
                .end((err, response) => {
                    response.should.have.status(422);
                    response.body.should.equal("Invalid file contents");
                    done();
                })
        })

        it("It should POST return status 422 since Invalid file contents",(done)=>{
            chai.request(server)
                .post("/time_series/time_series_name1/confirmed")
                .set('content-type', 'text/plain')
                .send(table_extra_data)
                .end((err, response) => {
                    response.should.have.status(422);
                    response.body.should.equal("Invalid file contents");
                    done();
                })
        })
    })

    // Then, GET request should return some data
    describe("Test GET /time_series/time_series_name1/:data_type", () => {
        it("GET /time_series/time_series_name1/confirmed should return status 200",(done)=>{
            chai.request(server)
                .get("/time_series/time_series_name1/confirmed")
                .end((err, response) => {
                    response.should.have.status(200);
                    response.text.should.equal(table_confirmed_update);
                    done();
                })
        })

        it("GET /time_series/time_series_name1/recovered should return status 200",(done)=>{
            chai.request(server)
                .get("/time_series/time_series_name1/recovered")
                .end((err, response) => {
                    response.should.have.status(200);
                    response.text.should.equal(table_recovered_update);
                    done();
                })
        })

        it("GET /time_series/time_series_name1/deaths should return status 200",(done)=>{
            chai.request(server)
                .get("/time_series/time_series_name1/deaths")
                .end((err, response) => {
                    response.should.have.status(200);
                    response.text.should.equal(table_deaths_update);
                    done();
                })
        })

        it("GET /time_series/time_series_name1/active should return status 200",(done)=>{
            chai.request(server)
                .get("/time_series/time_series_name1/active")
                .end((err, response) => {
                    response.should.have.status(200);
                    response.text.should.equal(table_active_update);
                    done();
                })
        })

        it("GET /time_series/time_series_name1/confirmed?format=csv should return status 200",(done)=>{
            chai.request(server)
                .get("/time_series/time_series_name1/confirmed?format=csv")
                .end((err, response) => {
                    response.should.have.status(200);
                    response.text.should.equal(table_confirmed_update);
                    done();
                })
        })

        it("GET /time_series/time_series_name1/active?format=json should return status 200",(done)=>{
            chai.request(server)
                .get("/time_series/time_series_name1/active?format=json")
                .end((err, response) => {
                    response.should.have.status(200);
                    //"Province/State,Country/Region,Lat,Long,1/22/20,1/23/20\n" +
                    //         ",Afghanistan,33.93911,67.709953,5,5\n" +
                    //         ",Albania,41.1533,20.1683,5,3\n" +
                    //         ",Algeria,28.0339,1.6596,5,5\n" +
                    //         "Australian Capital Territory,Australia,-35.4735,149.0124,5,5\n" +
                    //         "New South Wales,Australia,-33.8688,151.2093,5,5";
                    response.body.should.deep.equal([
                        {
                            'Province/State': '',
                            'Country/Region': 'Afghanistan',
                            'Lat': '33.93911',
                            'Long': '67.709953',
                            '1/22/20': '5',
                            '1/23/20': '5'
                        },
                        {
                            'Province/State': '',
                            'Country/Region': 'Algeria',
                            'Lat': '28.0339',
                            'Long': '1.6596',
                            '1/22/20': '5',
                            '1/23/20': '5'
                        },
                        {
                            'Province/State': 'Australian Capital Territory',
                            'Country/Region': 'Australia',
                            'Lat': '-35.4735',
                            'Long': '149.0124',
                            '1/22/20': '5',
                            '1/23/20': '5'
                        },
                        {
                            'Province/State': '',
                            'Country/Region': 'Albania',
                            'Lat': '41.1533',
                            'Long': '20.1683',
                            '1/22/20': '5',
                            '1/23/20': '3'
                        },
                        {
                            'Province/State': 'New South Wales',
                            'Country/Region': 'Australia',
                            'Lat': '-33.8688',
                            'Long': '151.2093',
                            '1/22/20': '5',
                            '1/23/20': '5'
                        },
                    ]);
                    done();
                })
        })

        it("GET /time_series/time_series_name1/confirmed?start_date=2020-01-24&countries=Australia,Canada should return empty string and status 200",(done)=>{
            chai.request(server)
                .get("/time_series/time_series_name1/confirmed?start_date=2020-01-24&countries=Australia,Canada")
                .end((err, response) => {
                    response.should.have.status(200);
                    response.text.should.equal(
                        "Province/State,Country/Region,Lat,Long\n" +
                        "Australian Capital Territory,Australia,-35.4735,149.0124\n" +
                        "New South Wales,Australia,-33.8688,151.2093");
                    done();
                })
        })

        it("GET /time_series/time_series_name1/confirmed?start_date=2020-01-23&countries=Australia,Canada should return 2 data rows and status 200",(done)=>{
            chai.request(server)
                .get("/time_series/time_series_name1/confirmed?start_date=2020-01-23&countries=Australia,Canada")
                .end((err, response) => {
                    response.should.have.status(200);
                    response.text.should.equal(
                        "Province/State,Country/Region,Lat,Long,1/23/20\n" +
                        "Australian Capital Territory,Australia,-35.4735,149.0124,8\n" +
                        "New South Wales,Australia,-33.8688,151.2093,10");
                    done();
                })
        })
    })

    // Test DELETE route for /time_series/time_series_name1
    describe("Test DELETE /time_series/time_series_name1", () => {
        it("It should DELETE the table time_series_name1_confirmed in database with status 200", (done)=>{
            chai.request(server).delete("/time_series/time_series_name1").end((err, response) => {
                response.should.have.status(200);
                response.body.should.equal("Successfully deleted");
                done();
            })
        })
    })

    // After deletion, database contain no files, so GET request must return 400
    describe("Test GET /time_series/time_series_name1/:data_type", () => {
        it("GET /time_series/time_series_name1/confirmed should return status 400",(done)=>{
            chai.request(server)
                .get("/time_series/time_series_name1/confirmed")
                .end((err, response) => {
                    response.should.have.status(400);
                    response.body.should.equal("Malformed request");
                    done();
                })
        })

        it("GET /time_series/time_series_name1/recovered should return status 400",(done)=>{
            chai.request(server)
                .get("/time_series/time_series_name1/recovered")
                .end((err, response) => {
                    response.should.have.status(400);
                    response.body.should.equal("Malformed request");
                    done();
                })
        })

        it("GET /time_series/time_series_name1/deaths should return status 400",(done)=>{
            chai.request(server)
                .get("/time_series/time_series_name1/deaths")
                .end((err, response) => {
                    response.should.have.status(400);
                    response.body.should.equal("Malformed request");
                    done();
                })
        })

        it("GET /time_series/time_series_name1/active should return status 400",(done)=>{
            chai.request(server)
                .get("/time_series/time_series_name1/active")
                .end((err, response) => {
                    response.should.have.status(400);
                    response.body.should.equal("Malformed request");
                    done();
                })
        })
    })
})

describe('Test daily_reports API', () => {
    const daily_test =
        "FIPS,Admin2,Province_State,Country_Region,Last_Update,Lat,Long_,Confirmed,Deaths,Recovered,Active,Combined_Key,Incident_Rate,Case_Fatality_Ratio\n" +
        '45001,Abbeville,South Carolina,US,2020-06-06 02:33:00,34.22333378,-82.46170658,47,0,0,47,"Abbeville, South Carolina, US",191.625555510254,0.0\n' +
        '22001,Acadia,Louisiana,US,2020-06-06 02:33:00,30.2950649,-92.41419698,467,26,0,441,"Acadia, Louisiana, US",752.6795068095737,5.56745182012848';

    const daily_update_test =
        "FIPS,Admin2,Province_State,Country_Region,Last_Update,Lat,Long_,Confirmed,Deaths,Recovered,Active,Combined_Key,Incident_Rate,Case_Fatality_Ratio\n" +
        '22001,Acadia,Louisiana,US,2020-06-06 02:33:00,30.2950649,-92.41419698,467,26,0,441,"Acadia, Louisiana, US",752.6795068095737,5\n' +
        ',,Brussels,Belgium,2021-01-04 05:22:02,50.8503,4.3517,81719,0,0,81719,"Brussels, Belgium",6707.873146426651,0.0\n' +
        '45001,Abbeville,South Carolina,US,2020-06-06 02:33:00,34.22333378,-82.46170658,47,0,0,47,"Abbeville, South Carolina, US",191.625555510254,1\n' +
        ',,East Flanders,Belgium,2021-01-04 05:22:02,51.0362,3.7373,65458,0,0,65458,"East Flanders, Belgium",4291.6102553343535,0.0';

    const after_upadate =
        "FIPS,Admin2,Province_State,Country_Region,Last_Update,Lat,Long_,Confirmed,Deaths,Recovered,Active,Combined_Key,Incident_Rate,Case_Fatality_Ratio\n" +
        '22001,Acadia,Louisiana,US,2020-06-06 02:33:00,30.2950649,-92.41419698,467,26,0,441,"Acadia, Louisiana, US",752.6795068095737,5\n'+
        ',,Brussels,Belgium,2021-01-04 05:22:02,50.8503,4.3517,81719,0,0,81719,"Brussels, Belgium",6707.873146426651,0.0\n' +
        '45001,Abbeville,South Carolina,US,2020-06-06 02:33:00,34.22333378,-82.46170658,47,0,0,47,"Abbeville, South Carolina, US",191.625555510254,1\n' +
        ',,East Flanders,Belgium,2021-01-04 05:22:02,51.0362,3.7373,65458,0,0,65458,"East Flanders, Belgium",4291.6102553343535,0.0';

    const less_columns =
        "FIPS,Admin2,Province_State,Country_Region,Last_Update,Lat,Long_,Confirmed,Deaths,Recovered,Active,Combined_Key,Incident_Rate\n" +
        '45001,Abbeville,South Carolina,US,2020-06-06 02:33:00,34.22333378,-82.46170658,47,0,0,47,"Abbeville, South Carolina, US",191.625555510254\n' +
        '22001,Acadia,Louisiana,US,2020-06-06 02:33:00,30.2950649,-92.41419698,467,26,0,441,"Acadia, Louisiana, US",752.6795068095737';

    const different_columns =
        "fips,Admin2,Province_State,Country_Region,Last_Update,Lat,Long_,Confirmed,Deaths,Recovered,Active,Combined_Key,Incident_Rate,Case_Fatality_Ratio\n" +
        '45001,Abbeville,South Carolina,US,2020-06-06 02:33:00,34.22333378,-82.46170658,47,0,0,47,"Abbeville, South Carolina, US",191.625555510254,0.0\n' +
        '22001,Acadia,Louisiana,US,2020-06-06 02:33:00,30.2950649,-92.41419698,467,26,0,441,"Acadia, Louisiana, US",752.6795068095737,5.56745182012848';

    const extra_data =
        "FIPS,Admin2,Province_State,Country_Region,Last_Update,Lat,Long_,Confirmed,Deaths,Recovered,Active,Combined_Key,Incident_Rate,Case_Fatality_Ratio\n" +
        '45001,Abbeville,South Carolina,US,2020-06-06 02:33:00,34.22333378,-82.46170658,47,0,0,47,"Abbeville, South Carolina, US",191.625555510254,0.0,1\n' +
        '22001,Acadia,Louisiana,US,2020-06-06 02:33:00,30.2950649,-92.41419698,467,26,0,441,"Acadia, Louisiana, US",752.6795068095737,5.56745182012848';

    // At first, database contain no files, so GET request must return 400
    describe("Test GET /daily_reports/day1", () => {
        it("GET /daily_reports/day1 should return status 400",(done)=>{
            chai.request(server)
                .get("/daily_reports/day1")
                .end((err, response) => {
                    response.should.have.status(400);
                    response.body.should.equal("Malformed request");
                    done();
                })
        })
    })

    // At first, database contain no files, so DELETE request must return 404
    describe("Test DELETE /daily_reports/day1", () => {
        it("It should return status 404 since there is no daily_reports files", (done)=>{
            chai.request(server).delete("/daily_reports/day1").end((err, response) => {
                response.should.have.status(404);
                response.body.should.equal("Daily reports not found");
                done();
            })
        })
    })

    // Then, POST /daily_reports/day1 with some example data
    describe("Test POST /daily_reports/day1", () => {
        it("It should POST the table day1 and create new table with status 200",(done)=>{
            chai.request(server)
                .post("/daily_reports/day1")
                .set('content-type', 'text/plain')
                .send(daily_test)
                .end((err, response) => {
                    response.should.have.status(200);
                    response.body.should.equal("Uploaded successful");
                    done();
                })
        })

        it("It should POST the table daily_reports_day1 update data with status 200",(done)=>{
            chai.request(server)
                .post("/daily_reports/day1")
                .set('content-type', 'text/plain')
                .send(daily_update_test)
                .end((err, response) => {
                    response.should.have.status(200);
                    response.body.should.equal("Updated successful");
                    done();
                })
        })

        it("It should POST return status 422 since Invalid file contents",(done)=>{
            chai.request(server)
                .post("/daily_reports/day1")
                .set('content-type', 'text/plain')
                .send(less_columns)
                .end((err, response) => {
                    response.should.have.status(422);
                    response.body.should.equal("Invalid file contents");
                    done();
                })
        })

        it("It should POST return status 422 since Invalid file contents",(done)=>{
            chai.request(server)
                .post("/daily_reports/day1")
                .set('content-type', 'text/plain')
                .send(different_columns)
                .end((err, response) => {
                    response.should.have.status(422);
                    response.body.should.equal("Invalid file contents");
                    done();
                })
        })

        it("It should POST return status 422 since Invalid file contents",(done)=>{
            chai.request(server)
                .post("/daily_reports/day1")
                .set('content-type', 'text/plain')
                .send(extra_data)
                .end((err, response) => {
                    response.should.have.status(422);
                    response.body.should.equal("Invalid file contents");
                    done();
                })
        })
    })

    // test for daily_reports get apis
    describe("Test GET/daily_reports/day1", () => {
        it("GET /daily_reports/day1 should return status 200",(done)=>{
            chai.request(server)
                .get("/daily_reports/day1")
                .end((err, response) => {
                    response.should.have.status(200);
                    response.text.should.equal(after_upadate);
                    done();
                })
        })

        it("GET /daily_reports/day1?data_type=deaths should return status 200 with death and confirm column",(done)=>{
            chai.request(server)
                .get("/daily_reports/day1?data_type=deaths,confirmed,active")
                .end((err, response) => {
                    response.should.have.status(200);
                    response.text.should.equal(
                        'FIPS,Admin2,Province_State,Country_Region,Last_Update,Lat,Long_,Deaths,Confirmed,Active,Combined_Key,Incident_Rate,Case_Fatality_Ratio\n' +
                        '22001,Acadia,Louisiana,US,2020-06-06 02:33:00,30.2950649,-92.41419698,26,467,441,"Acadia, Louisiana, US",752.6795068095737,5\n' +
                        ',,Brussels,Belgium,2021-01-04 05:22:02,50.8503,4.3517,0,81719,81719,"Brussels, Belgium",6707.873146426651,0.0\n' +
                        '45001,Abbeville,South Carolina,US,2020-06-06 02:33:00,34.22333378,-82.46170658,0,47,47,"Abbeville, South Carolina, US",191.625555510254,1\n' +
                        ',,East Flanders,Belgium,2021-01-04 05:22:02,51.0362,3.7373,0,65458,65458,"East Flanders, Belgium",4291.6102553343535,0.0')
                    done();
                })
        })

        it("GET /daily_reports/day1?start_date=2021-01-01&end_date=2021-01-05 should return status 200 with data that satisfy condition",(done)=>{
            chai.request(server)
                .get("/daily_reports/day1?start_date=2021-01-01&end_date=2021-01-05")
                .end((err, response) => {
                    response.should.have.status(200);
                    response.text.should.equal(
                        "FIPS,Admin2,Province_State,Country_Region,Last_Update,Lat,Long_,Confirmed,Deaths,Recovered,Active,Combined_Key,Incident_Rate,Case_Fatality_Ratio\n" +
                        ',,Brussels,Belgium,2021-01-04 05:22:02,50.8503,4.3517,81719,0,0,81719,"Brussels, Belgium",6707.873146426651,0.0\n' +
                        ',,East Flanders,Belgium,2021-01-04 05:22:02,51.0362,3.7373,65458,0,0,65458,"East Flanders, Belgium",4291.6102553343535,0.0');
                    done();
                })
        })

        it("GET /daily_reports/day1?countries=US&regions=South Carolina should return status 200 with data that satisfy condition",(done)=>{
            chai.request(server)
                .get("/daily_reports/day1?countries=US&regions=South Carolina")
                .end((err, response) => {
                    response.should.have.status(200);
                    response.text.should.equal(
                        "FIPS,Admin2,Province_State,Country_Region,Last_Update,Lat,Long_,Confirmed,Deaths,Recovered,Active,Combined_Key,Incident_Rate,Case_Fatality_Ratio\n" +
                        '45001,Abbeville,South Carolina,US,2020-06-06 02:33:00,34.22333378,-82.46170658,47,0,0,47,"Abbeville, South Carolina, US",191.625555510254,1');
                    done();
                })
        })

        it("GET /daily_reports/day1?countries=US&data_type=recovered&format=json should return status 200 with data that satisfy condition",(done)=>{
            chai.request(server)
                .get("/daily_reports/day1?countries=US&data_type=recovered&format=json")
                .end((err, response) => {
                    response.should.have.status(200);
                    response.body.should.deep.equal([
                        {
                            'FIPS': '22001',
                            'Admin2': 'Acadia',
                            'Province_State': 'Louisiana',
                            'Country_Region': 'US',
                            'Last_Update': '2020-06-06 02:33:00',
                            'Lat': '30.2950649',
                            'Long_': '-92.41419698',
                            'Combined_Key': '"Acadia, Louisiana, US"',
                            'Incident_Rate': '752.6795068095737',
                            'Case_Fatality_Ratio': '5',
                            'Recovered': '0'
                        },
                        {
                            'FIPS': '45001',
                            'Admin2': 'Abbeville',
                            'Province_State': 'South Carolina',
                            'Country_Region': 'US',
                            'Last_Update': '2020-06-06 02:33:00',
                            'Lat': '34.22333378',
                            'Long_': '-82.46170658',
                            'Combined_Key': '"Abbeville, South Carolina, US"',
                            'Incident_Rate': '191.625555510254',
                            'Case_Fatality_Ratio': '1',
                            'Recovered': '0'
                        }
                    ]);
                    done();
                })
        })
    })

    // Test DELETE route for /daily_reports/day1
    describe("Test DELETE /daily_reports/day1", () => {
        it("It should DELETE the table day1 in database with status 200", (done)=>{
            chai.request(server).delete("/daily_reports/day1").end((err, response) => {
                response.should.have.status(200);
                response.body.should.equal("Successfully deleted");
                done();
            })
        })
    })

    describe("Test GET /daily_reports/day1", () => {
        it("GET /daily_reports/day1 should return status 400",(done)=>{
            chai.request(server)
                .get("/daily_reports/day1")
                .end((err, response) => {
                    response.should.have.status(400);
                    response.body.should.equal("Malformed request");
                    done();
                })
        })
    })
})