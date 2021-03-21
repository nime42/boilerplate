/**
 * 
 */

var dbFile=process.argv[2];
var dbDefFile=process.argv[3];


if(dbFile==undefined) {
	console.log("Usage:"+process.argv[0]+" "+process.argv[1]+"DBfile [DB-definitionfile]");
	console.log("DB-file            - path to databasefile");
	console.log("DB-definitionfile  - sql-file with table definitions etc");
	process.exit();
}


fs = require('fs');


if (fs.existsSync(dbFile)) {
  console.log("Dbfile already exists");
  process.exit();
}

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);


if(dbDefFile!=undefined) {
fs.readFile(dbDefFile, 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  db.exec(data);
  db.close();
});
}