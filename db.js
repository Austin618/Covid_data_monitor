const Pool = require("pg").Pool;

const pool = new Pool({
    connectionString: 'postgres://chicjxydttwrhs:8976a8672f0e04398a6196ce0f516d90391fbd926b0287edc82245353c9a1be7@ec2-3-212-45-192.compute-1.amazonaws.com:5432/dalv37c4iflb4k',
    ssl: {
        rejectUnauthorized: false
      }
});

// const pool = new Pool({
//     host: "localhost",
//     user: "postgres",
//     port: 5432,
//     password: "new_password",
//     // password: "ming98xin",
//     database: "postgres"
// });

module.exports = pool;