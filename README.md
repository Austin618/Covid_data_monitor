# Covid_data_monitor

## Main features 
 * Upload CSV file to relational PostgreSQL database
 * Users can filter the database by some categories like start,end date or country.

## Pair Programming
 * Our group has two members, Qiming Ye(Austin618) and Ziqi Zhu(zzq20010617). As this project is mainly based on the backend, we divided the job by the functions. As you can see from the commit history, Qiming is mainly responsible for APIs for post function and Ziqi focuses on APIs for get function. Delete API is relatively simple compared to the other two functions so both of us contributed to part of this function. 
 * Before we start this project we have exchanged our opinion through what technic or database framework we should use. Finally, it comes to nodejs, PostgreSQL and uses Heroku as the deploy platform. 

## Program design 
Overall design:
Front End: HTML(a simple HTML for home page)
Back End: ExpressJs, NodeJs
Database: PostgreSQL(on Heroku PostgreSQL server)
Testing Framework: Mocha, Chai
Deployment: Heroku

To test the API, feel free to use the deployment Link: https://covid-monitor-79066.herokuapp.com/

* note that since there is a difference between the header name(for example “Incidence_Rate,Case-Fatality_Ratio”/ “Incident_Rate,Case_Fatality_Ratio”) on Github and swaggerhub, we take the header on Github as the correct version. 

* The reason is that firstly we are more familiar with node.js as a backend language since we have experience in CSC309 and deliverable2 of the team project.  Considering the required features for this assignment is contains some relational query work, SQL will be suitable, so we decide to use PostgreSQL. 

* Our reflections about the process:
  * It is worth spending some time figuring out what technic to use, a good 
  * It’s important to fork a repository to a personal account and keep the main branch clean. This can reduce conflict to some extent.
  * It’s important to read the example data carefully. When debugging for our APIs, there are some problems with the column header of CSV file such as “Long” and “Long_”, this cause some small errors during the design.
  * At first, we wish to create a forth table for time_series active automatically when all other 3 tables are created in POST request(corresponding fileName of confirmed, deaths, recovered). However, we thought this is not a good idea since we need extra storage places to store unnecessary data and also need update table active when any one of other 3 tables(confirmed, deaths, recovered) has changed. Finally, we decided use equation \<active = confirmed - recovered - deaths\> to calculate the data for active when we call GET request.
  * Remember to disable github actions on forks or wait CI on forks completed before merging pull request. At first, when we create .yml file for CI, it enables github actions not only on the upstream but also on our forks. When we merge pull requests immediately after pushing to forks, the CI on our fork and CI on upstream caused a conflict since they all connect to the same database. Any requests from one CI will cause an error to the requests on the other CI.

## Documentation and organization
### Test locally
 #### Test locally additional installation
 Please go to https://nodejs.org/en/ to install nodeJs the latest LTS version
  ##### Note: If you wish to set this up on their machine or a remote server, please ensure your nodeJs is later than 16.13.0 LTS version and npm later than 8.1.0. School lab are not available to run this project since nodeJs is not later than 16.13.0 LTS version
 
 #### Test locally
 Use the code below in terminal to get start: (Use Port 5000, i.e. http://localhost:5000/)
 ```
 $ npm install
 ```
 Use Port 5000, (i.e. http://localhost:5000/) to test locally
 * Note: The database is still on the Heroku PostgreSQL sever, you can switch to your local PostgreSQL.
 ```
 $ npm run dev
 ```
 To test our Mocha, Chai tests for APIs, you can see the github actions. And you can also run this code locally:
  ```
  $ npm run test
  ```
 Finally, you can use tools such as Postman to test APIs.
#### Test on the server
 Use Heroku Deployment link to test: https://covid-monitor-79066.herokuapp.com/
 .Then, you can use tools such as Postman to test APIs.

#### We use 6 APIs for this project: 
(Note: We follow all the functionality rules from https://app.swaggerhub.com/apis/viniciusd/covid-monitor/1.0.0#/dailyreports/addDailyReport)
```
POST    /time_series/:timeseries_name/:data_type
GET     /time_series/:timeseries_name/:data_type
DELETE  /time_series/:timeseries_name
POST    /daily_reports/:dailyreport_name
GET     /daily_reports/:dailyreport_name
DELETE  /daily_reports/:dailyreport_name
```
#### Important: 
* Some data in https://app.swaggerhub.com/apis/viniciusd/covid-monitor/1.0.0#/dailyreports/addDailyReport is not matched with https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data, we strictly follow the functionality rules in swaggerhub and the data in github.
* Note: For all data in github, please do not change the original case rules (i.e. uppercase and lowercase), please strictly follow the case rules for header lines on github.
* Although we will check any kinds of format errors such as header lines mismatched, we don't check if any input data itself is correct or not. We assume your input data itself are all correct. If you wish to modify the data, you can either post again to replace the old data or delete to create tables again. All kinds of data (i.e. after header line) can be stored into our database.
* We create many error checking including malformed request and invalid file contents.
* For data input, you can random type you data without following the alphabetical order on the github. Also, you can get active data by GET request of time_series if and only if have already existed the data of 3 other tables (confirmed, deaths, recovered) and the same data of 2 columns (Province/State,Country/Region).
* We assume all table columns are fixed and cannot add extra columns including time_series. (By piazza, we can assume this.) For example, if I call POST request:
```
POST    /time_series/timeseries1/confirmed

And the header of input content is: 
Province/State,Country/Region,Lat,Long,1/22/20,1/23/20
```
Then, if I call POST request again as below, it will return status 422.
```
POST    /time_series/timeseries1/confirmed

And the header of input content is: 
Province/State,Country/Region,Lat,Long,1/22/20,1/23/20,1/24/20
```
Then, if I call POST request for OTHER data_type as below, it will still return status 422.
```
POST    /time_series/timeseries1/deaths

And the header of input content is: 
Province/State,Country/Region,Lat,Long,1/22/20,1/23/20,1/24/20
```
* ONCE created a table for a certain tableName and a dataType, this tableName with other data_type must have the same header line. If you wish to modify table headers for the same tableName, you need delete this tableName and call POST requests again. And we do not fix the table headers columns for different tableName. For example, these 3 tables can exist at the same time since their tableName are different:
```
POST    /time_series/timeseries2/confirmed

And the header of input content is: 
Province/State,Country/Region,Lat,Long,1/22/20,1/23/20

POST    /time_series/timeseries3/deaths

And the header of input content is: 
Province/State,Country/Region,Lat,Long,1/22/20,1/23/20,1/24/20

POST    /time_series/timeseries4/confirmed

And the header of input content is: 
Province/State,Country/Region,Lat,Long,1/22/20,1/23/20,1/24/20,1/25/20
```

## Continuous Integration and Continuous Delivery
 
* Continuous Integration: Github Actions
* Continuous Delivery: Heroku

Note: We use Github Actions for CI and Mocha tests will be automatically run. If all the Mocha tests are passed. This project will wait for completing CI and then automatically deploy to Heroku for CD.

