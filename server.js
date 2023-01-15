const express = require("express");
const cors = require("cors");
const pool = require("./db");
const bodyParser = require("body-parser");
const path = require("path");
const converter = require('json-2-csv');

pool.connect().then(() => {
    console.log("Connected to database!")
}).catch(err=>console.log("Connection Failed!"));

// process.env stores the all information of environment variables
// process.env.PORT
const PORT = process.env.PORT || 5000;

const app = express();

// MiddleWare
// // create application/json parser
// app.use(bodyParser.json());
// // parse various different custom JSON types as JSON
// app.use(bodyParser.json({ type: 'application/*+json' }));
// // parse some custom thing into a Buffer
// app.use(bodyParser.raw({ type: 'application/vnd.custom-type' }));
// // parse an HTML body into a string
// app.use(bodyParser.text({ type: 'text/html' }));
// parse an text body into a string
app.use(bodyParser.text({ type: 'text/plain' }));
// // create application/x-www-form-urlencoded parser
// app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '/')));

// Shallow check
function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length)
        return false;
    for (let i = arr1.length; i--;) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
}

function arraysSetEqual(arr1, arr2) {
    if (arr1.length !== arr2.length)
        return false;
    for (let i = arr1.length; i--;) {
        if (arr1[i] !== arr2[i]['column_name']) {
            return false;
        }
    }
    return true;
}

async function getquery(tablename, pool, start_date, end_date, isactive) {
    if(isactive === false){
        if(start_date != null || end_date != null){
            tablename += "_deaths";
            insertQuery = "Select \"Province/State\", \"Country/Region\", \"Lat\", \"Long\"";
            const getheader = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '" + tablename + "';";
            const result = await pool.query(getheader);
            const colname = result.rows;
            for (let i = 4; i < colname.length; i++) {
                const date = colname[i]["column_name"];
                const split = date.split("/");
                const yearfront = "20";
                const year = yearfront + split[2];
                let datetrans = "";
                if(split[0].length===1){
                    datetrans = year + "-0" + split[0] + "-" + split[1];
                }else{
                    datetrans = year + "-" + split[0] + "-" + split[1];
                }
                if (start_date != null && end_date != null) {
                    if (datetrans >= start_date && datetrans <= end_date) {
                        insertQuery += ", \"" + date + "\"";
                    }
                } else if (start_date != null && datetrans >= start_date) {
                    insertQuery += ", \"" + date + "\"";
                } else if (end_date != null && datetrans <= end_date) {
                    insertQuery += ", \"" + date + "\"";
                }
            }
            insertQuery += " from";
        }else{
            insertQuery = "Select * from";
        }
    }else{
        const namefront = tablename;
        tablename += "_deaths";
        const province = tablename + ".\"Province/State\"";
        const country = tablename+ ".\"Country/Region\"";
        const lat = tablename+ ".\"Lat\"";
        const long = tablename+ ".\"Long\"";
        insertQuery = "Select "+province+", "+country+", "+lat+", "+long+"";
        const getheader = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '" + tablename + "';";
        const recheader = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '" +namefront+ "_recovered';";
        const cofheader = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '"  +namefront+ "_confirmed';";
        const result = await pool.query(getheader);
        const recresult = await pool.query(recheader);
        const cofresult = await pool.query(cofheader);
        const colname_d = result.rows;
        const colname_r = recresult.rows;
        const colname_c = cofresult.rows;
        const recover = namefront+"_recovered";
        const confirm = namefront+"_confirmed";
        const lat_ = ".\"Lat\"";
        const long_ = ".\"Long\"";
        for (let i = 4; i < colname_d.length; i++) {
            let flag = false;
            const date = colname_d[i]["column_name"];
            for (let j = 4; j < colname_r.length; j++){
                if(date === colname_r[j]["column_name"]){
                    flag = true;
                }
            }
            if(flag === false){
                break;
            }
            flag = false;
            for (let k = 4; k < colname_c.length; k++){
                if(date === colname_c[k]["column_name"]){
                    flag = true;
                }
            }
            if(flag === false){
                break;
            }
            const split = date.split("/");
            const yearfront = "20";
            const year = yearfront + split[2];
            const datetrans = year + "-" + split[0] + "-" + split[1];
            if (start_date != null && end_date != null) {
                if (datetrans >= start_date && datetrans <= end_date) {
                    insertQuery += ", CAST(CAST("+confirm+".\"" +date+ "\" As INT)-CAST("+tablename+".\"" +date+ "\" As INT)-CAST("+recover+".\"" +date+ "\" As INT) as varchar) as \"" +date+ "\"";
                }
            } else if (start_date != null && datetrans >= start_date) {
                insertQuery += ", CAST(CAST("+confirm+".\"" +date+ "\" As INT)-CAST("+tablename+".\"" +date+ "\" As INT)-CAST("+recover+".\"" +date+ "\" As INT) as varchar) as \"" +date+ "\"";
            } else if (end_date != null && datetrans <= end_date) {
                insertQuery += ", CAST(CAST("+confirm+".\"" +date+ "\" As INT)-CAST("+tablename+".\"" +date+ "\" As INT)-CAST("+recover+".\"" +date+ "\" As INT) as varchar) as \"" +date+ "\"";
            }else{
                insertQuery += ", CAST(CAST("+confirm+".\"" +date+ "\" As INT)-CAST("+tablename+".\"" +date+ "\" As INT)-CAST("+recover+".\"" +date+ "\" As INT) as varchar) as \"" +date+ "\"";
            }
        }
        insertQuery += " From "+tablename+", "+confirm+", "+recover+"  Where "+tablename+lat_+"="+confirm+lat_+" and "+tablename+lat_+"="+recover+lat_+" and "+tablename+long_+"="+confirm+long_+" and "+tablename+long_+"="+recover+long_+"";
    }
    return insertQuery;
}

// Routes for time_series
app.post("/time_series/:timeseries_name/:data_type", async (req, res) => {
    try {
        const time_series_file_name = req.params.timeseries_name;
        const data_type = req.params.data_type;
        const content = req.body;

        // check if the request is valid
        if (typeof time_series_file_name === 'undefined' || !time_series_file_name ||
            typeof data_type === 'undefined' || (data_type !== "confirmed" && data_type !== "recovered" && data_type !== "deaths")) {
            return res.status(400).json("Malformed request");
        }

        if (typeof content === 'undefined' || !content) {
            return res.status(422).json("Invalid file contents");
        }

        const combine_name = time_series_file_name + "_" + data_type;
        const time_series_confirmed = time_series_file_name + "_confirmed";
        const time_series_recovered = time_series_file_name + "_recovered";
        const time_series_deaths = time_series_file_name + "_deaths";

        // "\r" Used as a new line character in Mac OS before X
        // "\n" Used as a new line character in Unix/Mac OS X
        // "\r\n" Used as a new line character in Windows
        // split all different types of new line characters
        const split = content.split(/\r\n|\r|\n/);
        // split comma but avoid splitting comma in the double quotes
        // (i.e. only split comma not in the double quotes)
        const head = split[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const columnNum = head.length;
        if (columnNum < 4 || head[0] !== "Province/State" || head[1] !== "Country/Region" || head[2] !== "Lat" || head[3] !== "Long") {
            return res.status(422).json("Invalid file contents");
        }

        // Check if the format of input data is correct
        for (let i = 1; i < split.length; i++) {
            // split comma but avoid splitting comma in the double quotes
            // (i.e. only split comma not in the double quotes)
            const temp = split[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (temp.length !== columnNum) {
                return res.status(422).json("Invalid file contents");
            }
        }

        // Need check whether the column header of the new table is completely matched with other tables!!!
        const existConfirmed = await pool.query("select exists (SELECT * FROM information_schema.tables where table_schema = 'public' and table_name = $1);", [time_series_confirmed]);
        const existRecovered = await pool.query("select exists (SELECT * FROM information_schema.tables where table_schema = 'public' and table_name = $1);", [time_series_recovered]);
        const existDeaths = await pool.query("select exists (SELECT * FROM information_schema.tables where table_schema = 'public' and table_name = $1);", [time_series_deaths]);
        if (existConfirmed.rows[0]['exists']) {
            const confirmedHeader = await pool.query("select column_name from information_schema.columns where table_name = $1;", [time_series_confirmed]);
            if (!arraysSetEqual(head, confirmedHeader.rows)) {
                return res.status(422).json("Invalid file contents");
            }
        }
        if (existRecovered.rows[0]['exists']) {
            const recoveredHeader = await pool.query("select column_name from information_schema.columns where table_name = $1;", [time_series_recovered]);
            if (!arraysSetEqual(head, recoveredHeader.rows)) {
                return res.status(422).json("Invalid file contents");
            }
        }
        if (existDeaths.rows[0]['exists']) {
            const deathsHeader = await pool.query("select column_name from information_schema.columns where table_name = $1;", [time_series_deaths]);
            if (!arraysSetEqual(head, deathsHeader.rows)) {
                return res.status(422).json("Invalid file contents");
            }
        }

        const exist = await pool.query("select exists (SELECT * FROM information_schema.tables where table_schema = 'public' and table_name = $1);", [combine_name]);
        if (!exist.rows[0]['exists']) {
            // Table does not exist, need create new table and insert all data
            await pool.query("CREATE TABLE " + combine_name + " (\"Province/State\" varchar, \"Country/Region\" varchar, \"Lat\" varchar, \"Long\" varchar, PRIMARY KEY (\"Province/State\", \"Country/Region\"));");
            // Add columns from head[4] ~ head[Infinity]
            for (let i = 4; i < columnNum; i++) {
                await pool.query("ALTER TABLE " + combine_name + " ADD COLUMN \"" + head[i] + "\" varchar;");
            }
            // Insert line 1 ~ Infinity in table combine_name
            for (let i = 1; i < split.length; i++) {
                // split comma but avoid splitting comma in the double quotes
                // (i.e. only split comma not in the double quotes)
                const temp = split[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                let insertColumn = "";
                let insertValue = "";
                for (let i = 1; i < columnNum; i++) {
                    insertColumn += "\"" + head[i - 1] + "\", ";
                    insertValue += "$" + i + ", ";
                }
                insertColumn += "\"" + head[columnNum - 1] + "\"";
                insertValue += "$" + columnNum;
                await pool.query("INSERT INTO " + combine_name + " (" + insertColumn + ") values (" + insertValue + ");", temp);
            }
            return res.status(200).json("Uploaded successful");
        } else {
            // Table exists. Insert if no conflict; otherwise, update for line 1 ~ Infinity in table combine_name
            for (let i = 1; i < split.length; i++) {
                // split comma but avoid splitting comma in the double quotes
                // (i.e. only split comma not in the double quotes)
                const temp = split[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                let insertColumn = "";
                let insertValue = "";
                let setString = "";
                for (let i = 1; i < columnNum; i++) {
                    insertColumn += "\"" + head[i - 1] + "\", ";
                    insertValue += "$" + i + ", ";
                    if (i >= 3) {
                        setString += "\"" + head[i - 1] + "\"=$" + i + ", ";
                    }
                }
                insertColumn += "\"" + head[columnNum - 1] + "\"";
                insertValue += "$" + columnNum;
                setString += "\"" + head[columnNum - 1] + "\"=$" + columnNum;
                await pool.query("INSERT INTO " + combine_name + " (" + insertColumn + ") values (" + insertValue + ") ON CONFLICT (\"Province/State\", \"Country/Region\") DO UPDATE SET " + setString + ";", temp)
            }
            return res.status(200).json("Updated successful");
        }
    } catch (err) {
        res.status(404).json("Bad request");
        console.error(err.message);
    }
})

app.get("/time_series/:timeseries_name/:data_type", async (req, res) => {
    try {
        const url = require('url');
        const params = url.parse(req.url,true).query;
        for(const key in params) {
            switch(key) {
                case "start_date":
                  var start_date = params["start_date"];
                  break;
                case "end_date":
                  var end_date = params["end_date"];
                  break;
                case "countries":
                  var countries = params["countries"];
                  break;
                case "regions":
                  var regions = params["regions"];
                  break;
                case "format":
                  var format = params["format"];
                  break;
                default:
            }
        }
        if(req.params.data_type === "active"){
            const tables = ["deaths", "recovered", "confirmed"];
            for(let i = 0; i < tables.length; i++){
                const exist = await pool.query("select exists (SELECT * FROM information_schema.tables where table_schema = 'public' and table_name = $1);", [req.params.timeseries_name +"_"+tables[i]]);
                if (!exist.rows[0]['exists']) {
                    // table not exists
                    return res.status(400).json("Malformed request");
                }
            }
            let mergeQuery = await getquery(req.params.timeseries_name, pool, start_date, end_date, true);
            if(Object.keys(params).length !== 0){
                if(countries != null || regions != null){
                    let andflag = false;
                    const deathtb = req.params.timeseries_name + "_deaths";
                    if(countries != null){
                        mergeQuery += " and (";
                        const split = countries.split(",");
                        for(let i = 0; i < split.length; i++){
                            if(i>=1){
                                mergeQuery += " or "+deathtb+".\"Country/Region\"='"+split[i]+"'";
                            }else{
                                mergeQuery += ""+deathtb+".\"Country/Region\"='"+split[i]+"'";
                            }
                        }
                        mergeQuery += ")";
                        andflag = true;
                    }
                    if(regions != null){
                        if(andflag){
                            mergeQuery += " and (";
                        }
                        const split = regions.split(",");
                        for(let i = 0; i < split.length; i++){
                            if(i>=1){
                                mergeQuery += " or "+deathtb+".\"Province/State\"='"+split[i]+"'";
                            }else{
                                mergeQuery += ""+deathtb+".\"Province/State\"='"+split[i]+"'";
                            }
                        }
                        if(andflag){
                            mergeQuery += ")";
                        }
                    }
                }
            }
            mergeQuery += ";";

            pool.query(mergeQuery, (err, result)=>{
                if(!err){
                    if(format === "json"){
                        // console.log("Successful operation");
                        res.status(200).json(result.rows);
                    }else{
                        converter.json2csv(result.rows, (err, csv) => {
                            if (err) {
                                res.status(400).json("Malformed request");
                                throw err;
                            }
                            // console.log("Successful operation");
                            res.status(200).send(csv.replace(/"""/g, '"'));
                        });
                    }
                }
                else{
                    console.log(err.message);
                    res.status(400).json("Malformed request");
                }
            })
            return;
        }
        const exist = await pool.query("select exists (SELECT * FROM information_schema.tables where table_schema = 'public' and table_name = $1);", [req.params.timeseries_name +"_"+req.params.data_type]);
        if (!exist.rows[0]['exists']) {
            return res.status(400).json("Malformed request");
        }
        const time_series_file_name = req.params.timeseries_name +"_"+req.params.data_type;
        let insertQuery = await getquery(req.params.timeseries_name, pool, start_date, end_date, false);

        insertQuery += " "+time_series_file_name+"";
        if(Object.keys(params).length !== 0){
            if(countries != null || regions != null){
                insertQuery += " Where ";
            }
            let andflag = false;
            if(countries != null){
                if(start_date!=null || end_date!=null){

                }
                const split = countries.split(",");
                for(let i = 0; i < split.length; i++){
                    if(i>=1){
                        insertQuery += " or \"Country/Region\"='"+split[i]+"'";
                    }else{
                        insertQuery += "(\"Country/Region\"='"+split[i]+"'";
                    }
                }
                insertQuery += ")";
                andflag = true;
            }
            if(regions != null){
                if(andflag){
                    insertQuery += " and (";
                }
                const split = regions.split(",");
                for(let i = 0; i < split.length; i++){
                    if(i>=1){
                        insertQuery += " or \"Province/State\"='"+split[i]+"'";
                    }else{
                        insertQuery += "\"Province/State\"='"+split[i]+"'";
                    }
                }
                if(andflag){
                    insertQuery += ")";
                }
            }
        }
        insertQuery += ";";
        pool.query(insertQuery, (err, result)=>{
            if(!err){
                if(format === "json"){
                    // console.log("Successful operation");
                    res.status(200).send(result.rows);
                }else{
                    converter.json2csv(result.rows, (err, csv) => {
                        if (err) {
                            res.status(400).json("Malformed request");
                            throw err;
                        }
                        // console.log("Successful operation");
                        res.status(200).send(csv.replace(/"""/g, '"'));
                    });
                }
            }
            else{
                console.log(err.message);
                res.status(400).json("Malformed request");
            }
        })
    } catch (err) {
        console.error(err.message);
        res.status(400).json("Malformed request");
    }
})

app.delete("/time_series/:timeseries_name", async (req, res) => {
    try {
        // active = confirmed - recovered - deaths
        // after generating table confirmed, recovered and deaths, the forth table must be generated automatically
        const time_series_file_name = req.params.timeseries_name;
        const time_series_confirmed = time_series_file_name + "_confirmed";
        const time_series_recovered = time_series_file_name + "_recovered";
        const time_series_deaths = time_series_file_name + "_deaths";
        const time_series_active = time_series_file_name + "_active";
        const existConfirmed = await pool.query("select exists (SELECT * FROM information_schema.tables where table_schema = 'public' and table_name = $1);", [time_series_confirmed]);
        const existRecovered = await pool.query("select exists (SELECT * FROM information_schema.tables where table_schema = 'public' and table_name = $1);", [time_series_recovered]);
        const existDeaths = await pool.query("select exists (SELECT * FROM information_schema.tables where table_schema = 'public' and table_name = $1);", [time_series_deaths]);
        const existActive = await pool.query("select exists (SELECT * FROM information_schema.tables where table_schema = 'public' and table_name = $1);", [time_series_active]);
        let flag = false;
        if (existConfirmed.rows[0]['exists']) {
            await pool.query("DROP TABLE " + time_series_confirmed);
            flag = true;
        }
        if (existRecovered.rows[0]['exists']) {
            await pool.query("DROP TABLE " + time_series_recovered);
            flag = true;
        }
        if (existDeaths.rows[0]['exists']) {
            await pool.query("DROP TABLE " + time_series_deaths);
            flag = true;
        }
        if (existActive.rows[0]['exists']) {
            await pool.query("DROP TABLE " + time_series_active);
            flag = true;
        }
        if (flag) {
            return res.status(200).json("Successfully deleted");
        } else {
            return res.status(404).json("Time series not found");
        }
    } catch (err) {
        res.status(404).json("Bad request");
        console.error(err.message);
    }
})

// Routes for daily_reports
app.post("/daily_reports/:dailyreport_name", async (req, res) => {
    try {
        const daily_report_file_name = req.params.dailyreport_name;
        const content = req.body;

        if (typeof daily_report_file_name === 'undefined' || !daily_report_file_name) {
            return res.status(400).json("Malformed request");
        }

        if (typeof content === 'undefined' || !content) {
            return res.status(422).json("Invalid file contents");
        }

        // "\r" Used as a new line character in Mac OS before X
        // "\n" Used as a new line character in Unix/Mac OS X
        // "\r\n" Used as a new line character in Windows
        // split all different types of new line characters
        const split = content.split(/\r\n|\r|\n/);
        // split comma but avoid splitting comma in the double quotes
        // (i.e. only split comma not in the double quotes)
        // Check if the format of input header is correct
        const head = split[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (!arraysEqual(head, ["FIPS", "Admin2", "Province_State", "Country_Region", "Last_Update", "Lat", "Long_", "Confirmed", "Deaths", "Recovered", "Active", "Combined_Key", "Incident_Rate", "Case_Fatality_Ratio"])) {
            return res.status(422).json("Invalid file contents");
        }
        // Check if the format of input data is correct
        for (let i = 1; i < split.length; i++) {
            // split comma but avoid splitting comma in the double quotes
            // (i.e. only split comma not in the double quotes)
            const temp = split[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (temp.length !== 14) {
                return res.status(422).json("Invalid file contents");
            }
        }

        const exist = await pool.query("select exists (SELECT * FROM information_schema.tables where table_schema = 'public' and table_name = $1);",
            [daily_report_file_name]);
        if (!exist.rows[0]['exists']) {
            // Table does not exist, need create new table and insert all data
            await pool.query("CREATE TABLE " + daily_report_file_name + " (\"FIPS\" varchar, \"Admin2\" varchar, \"Province_State\" varchar, \"Country_Region\" varchar, \"Last_Update\" varchar, \"Lat\" varchar, \"Long_\" varchar, \"Confirmed\" varchar, \"Deaths\" varchar, \"Recovered\" varchar, \"Active\" varchar, \"Combined_Key\" varchar, \"Incident_Rate\" varchar, \"Case_Fatality_Ratio\" varchar, PRIMARY KEY (\"Province_State\", \"Country_Region\", \"Last_Update\"));");
            // Insert line 1 ~ Infinity in table daily_report_file_name
            for (let i = 1; i < split.length; i++) {
                // split comma but avoid splitting comma in the double quotes
                // (i.e. only split comma not in the double quotes)
                const temp = split[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                // const combine = [daily_report_file_name].concat(temp);
                await pool.query("INSERT INTO " + daily_report_file_name + " (\"FIPS\", \"Admin2\", \"Province_State\", \"Country_Region\", \"Last_Update\", \"Lat\", \"Long_\", \"Confirmed\", \"Deaths\", \"Recovered\", \"Active\", \"Combined_Key\", \"Incident_Rate\", \"Case_Fatality_Ratio\") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);", temp);
            }
            return res.status(200).json("Uploaded successful");
        } else {
            // Table exists. Insert if no conflict; otherwise, update for line 1 ~ Infinity in table daily_report_file_name
            for (let i = 1; i < split.length; i++) {
                // split comma but avoid splitting comma in the double quotes
                // (i.e. only split comma not in the double quotes)
                const temp = split[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                // const combine = [daily_report_file_name].concat(temp);
                await pool.query("INSERT INTO " + daily_report_file_name + " (\"FIPS\", \"Admin2\", \"Province_State\", \"Country_Region\", \"Last_Update\", \"Lat\", \"Long_\", \"Confirmed\", \"Deaths\", \"Recovered\", \"Active\", \"Combined_Key\", \"Incident_Rate\", \"Case_Fatality_Ratio\") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT (\"Province_State\", \"Country_Region\", \"Last_Update\") DO UPDATE SET \"FIPS\"=$1, \"Admin2\"=$2, \"Lat\"=$6, \"Long_\"=$7, \"Confirmed\"=$8, \"Deaths\"=$9, \"Recovered\"=$10, \"Active\"=$11, \"Combined_Key\"=$12, \"Incident_Rate\"=$13, \"Case_Fatality_Ratio\"=$14;", temp)
            }
            return res.status(200).json("Updated successful");
        }
    } catch (err) {
        res.status(404).json("Bad request");
        console.error(err.message);
    }
})

app.get("/daily_reports/:dailyreport_name", async (req, res) => {
    try {
        const daily_report_file_name = req.params.dailyreport_name;

        const exist = await pool.query("select exists (SELECT * FROM information_schema.tables where table_schema = 'public' and table_name = $1);", [daily_report_file_name]);
        if (!exist.rows[0]['exists']) {
            // table not exists
            return res.status(400).json("Malformed request");
        }

        const url = require('url');
        const params = url.parse(req.url,true).query;
        for(let key in params) {
            switch(key) {
                case "start_date":
                  var start_date = params["start_date"];
                  break;
                case "end_date":
                  var end_date = params["end_date"];
                  break;
                case "countries":
                  var countries = params["countries"];
                  break;
                case "regions":
                  var regions = params["regions"];
                  break;
                case "combined_key":
                  var combined_key = params["combined_key"];
                  break;
                case "data_type":
                  var data_type = params["data_type"];
                  break;
                case "format":
                 var format = params["format"];
                  break;                       
                default:
            }
        }
        let insertQuery = "";
        if(data_type != null){
            const split = data_type.split(",");
            insertQuery = "Select \"FIPS\", \"Admin2\", \"Province_State\", \"Country_Region\", \"Last_Update\", \"Lat\", \"Long_\", ";
            for(let i = 0; i < split.length; i++){
                if(split[i] === "confirmed"){
                    insertQuery += "\"Confirmed\", ";
                }else if(split[i] === "deaths"){
                    insertQuery += "\"Deaths\", ";
                }else if(split[i] === "recovered"){
                    insertQuery += "\"Recovered\", ";
                }else if(split[i] === "active"){
                    insertQuery += "\"Active\", ";
                }                 
            }
            insertQuery += "\"Combined_Key\", \"Incident_Rate\", \"Case_Fatality_Ratio\" from " + daily_report_file_name + "";
        } else {
            insertQuery = "Select * from  " + daily_report_file_name + "";
        }
        if(Object.keys(params).length !== 0){
            let andflag = false;
            if((Object.keys(params).length === 1 && (format != null || data_type != null)) || (Object.keys(params).length === 2 && format != null && data_type != null)){
            }else{
                insertQuery += " WHERE ";
            }
            if(start_date != null){
                insertQuery += "\"Last_Update\" >= '" + start_date + "'";
                andflag = true;
            }
            if(end_date != null){
                if(andflag){
                    insertQuery += " and (";
                }
                insertQuery += "\"Last_Update\" <= '" + end_date + "'";
                if(andflag){
                    insertQuery += ")";
                }
                andflag = true;
            }
            if(countries != null){
                if(andflag){
                    insertQuery += " and (";
                }
                const split = countries.split(",");
                for(let i = 0; i < split.length; i++){
                    if(i>=1){
                        insertQuery += " or \"Country_Region\"='"+split[i]+"'";
                    }else{
                        insertQuery += "\"Country_Region\"='"+split[i]+"'";
                    }
                }
                if(andflag){
                    insertQuery += ")";
                }
                andflag = true;
            }
            if(regions != null){
                if(andflag){
                    insertQuery += " and (";
                }
                const split = regions.split(",");
                for(let i = 0; i < split.length; i++){
                    if(i>=1){
                        insertQuery += " or \"Province_State\"='"+split[i]+"'";
                    }else{
                        insertQuery += "\"Province_State\"='"+split[i]+"'";
                    }
                }
                if(andflag){
                    insertQuery += ")";
                }
                andflag = true;
            }
            if(combined_key != null){
                if(andflag){
                    insertQuery += " and ";
                }
                insertQuery += "\"Combined_Key\" ='" + combined_key + "'";
            }
        }
        insertQuery += ";";
        pool.query(insertQuery, (err, result)=>{
            if(!err){
                if(format === "json"){
                    // console.log("Successful operation");
                    res.status(200).send(result.rows);
                }else{
                    converter.json2csv(result.rows, (err, csv) => {
                        if (err) {
                            res.status(400).json("Malformed request");
                            throw err;
                        }
                        // console.log("Successful operation");
                        res.status(200).send(csv.replace(/"""/g, '"'));
                    });
                }
            }
            else{
                console.log(err.message);
                res.status(400).json("Malformed request");
            }
        })
    } catch (err) {
        console.error(err.message);
        res.status(400).json("Malformed request");
    }
})

app.delete("/daily_reports/:dailyreport_name", async (req, res) => {
    try {
        const daily_report_file_name = req.params.dailyreport_name;
        const exist = await pool.query("select exists (SELECT * FROM information_schema.tables where table_schema = 'public' and table_name = $1);",
            [daily_report_file_name]);
        if (exist.rows[0]['exists']) {
            // table exists
            await pool.query("DROP TABLE " + daily_report_file_name);
            return res.status(200).json("Successfully deleted");
        } else {
            return res.status(404).json("Daily reports not found");
        }
    } catch (err) {
        res.status(404).json("Bad request");
        console.error(err.message);
    }
})

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT} ...`)
});

module.exports = app;
