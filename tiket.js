var color = require('colors');
var request = require('request');
var cheerio = require('cheerio');
var prompt = require('prompt');
var JsSearch = require('js-search');
var moment = require('moment');

var api = 'http://www.tiket.com/pesawat/cari?d=';
const airports = require('./maskapai.json');

var search = new JsSearch.Search('city');
search.addIndex('name');
search.addIndex('iata');
search.addIndex('city');
search.addDocuments(airports);

console.log('\n');
console.log(color.white('###################') + color.green('PENCARIAN TIKET PESAWAT') + color.white('###################'));
console.log(color.white('                                                               '));
console.log(color.white('        ::::::::::::::::::::::::::::::::::::::::::::::         '));
console.log(color.white("        '########:'####:'##:::'##:'########:'########:         "));
console.log(color.white("        ... ##..::. ##:: ##::'##:: ##.....::... ##..::         "))
console.log(color.white("        ::: ##::::: ##:: #####:::: ######:::::: ##::::         "));
console.log(color.white("        ::: ##::::: ##:: ##. ##::: ##...::::::: ##::::         "));
console.log(color.white("        ::: ##::::'####: ##::. ##: ########:::: ##::::         "));
console.log(color.white('        :::..:::::....::..::::..::........:::::..:::::         '));
console.log(color.white('                                                               '));
console.log(color.white('                                  Credit  : ')+ color.green('Deden Bangkit'));
console.log(color.white('                                  API Data: ')+ color.green('traveloka.com'));
console.log(color.white('#############################################################'));
console.log('\n');

function getIATA(airports, city, val) {
    var objects = [];
    for (var i in airports) {
        if (!airports.hasOwnProperty(i)) continue;
        if (typeof airports[i] == 'object') {
            objects = objects.concat(getIATA(airports[i], city, val));
        } else if (i == city && airports[i] == val || i == city && val == '') {
            objects.push(airports);
        } else if (airports[i] == val && city == ''){
            if (objects.lastIndexOf(airports) == -1){
                objects.push(airports);
            }
        }
    }
    return objects;
}

prompt.get([
  {properties: {dari: {description: color.cyan("Kota Keberangkatan:")}}},
  {properties: {ke: {description: color.cyan("Kota Tujuan:")}}},
  {properties: {tanggal: {description: color.cyan("Tanggal (YY-MM-DD):")}}},
  {properties: {dewasa: {description: color.cyan("Penumpang Dewasa:")}}},
  {properties: {anak: {description: color.cyan("Anak-anak (diatas 2 tahun):")}}},
  {properties: {infant: {description: color.cyan("Bayi (dibawah 2 tahun):")}}}
], function (err, result) {

  function place(string){
    return string.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  }

  var origin;

  if (result.dari === 'jogja'){
    origin = search.search('yogya');
  }else{
    origin = search.search(result.dari);
  }

  var destination;

  if (result.ke === 'jogja'){
    destination = search.search('yogya');
  }else{
    destination = search.search(result.ke);
  }

  var from = origin[0].iata;
  var to = destination[0].iata;
  var date;

  if (result.tanggal === 'sekarang'){
    date = moment().format('YYYY-MM-DD');
  }else if (result.tanggal === 'besok'){
    date = moment().add(1, 'days').format('YYYY-MM-DD');
  }else if (result.tanggal === 'lusa'){
    date = moment().add(2, 'days').format('YYYY-MM-DD');
  }else{
    date = moment(result.tanggal).format('YYYY-MM-DD');
  }

  var people = result.dewasa;
  var child = result.anak;
  var infant = result.infant;

request('https://www.tiket.com/pesawat/cari?d=' + from + '&a='+ to + '&date=' +date+ '&adult=' + people + '&child='+ child + '&infant=' + infant, function(error, response, html) {
    console.log('\n');

    var text = origin[0].name +' ('+from+')'+ ' --> ' + destination[0].name +' ('+to+') :: ' + moment(date).format("DD MMMM YYYY");

    console.log(text);
    console.log('\n');
    let $ = null
    let price = []
    let plane = []
    let depart = []
    let arrive = []
    let flightcode = []
    if (!error && response.statusCode == 200) {
      $ = cheerio.load(html)
      $('.td7 > h3').each( function(i, element) {
        let a = $(this).text()
        price.push(a)
      })
      $('.td1 > div > h6').each( function(i, element) {
        let b = $(this).text()
        plane.push(b)
      })
      $('.td2 > h4').each( function(i, element) {
        let c = $(this).text()
        depart.push(c)
      })
      $('.td3 > h4').each( function(i, element) {
        let d = $(this).text()
        arrive.push(d)
      })
      $('.td9').each( function(i, element) {
          let e = $(this).text()
          let f = e.replace(/\s/g, '')
          flightcode.push(f)
      })
    }
    for(let i=0; i<price.length; i++) {
      console.log(i + '. ' + color.yellow(plane[i]) + " (" + flightcode[i] + "), " + color.white(depart[i] + ' -> ' + arrive[i]) + " :: " + color.cyan(price[i]));
    }

    if (price.length === 0){
      //fullSearch(from, to, date, people, child, infant);
    }
  });
});

function fullSearch(from, to, date, people, child, infant){
  console.log(from + to + date + people + child + infant)
  request('http://www.traveloka.com/en/flight/fullsearch?ap='+ from +'.'+ to +'&dt='+ date + '.NA&ps=' + people +'.'+child+'.'+infant+'&sc=ECONOMY', function(error, response, html) {
      let $ = null
      let price = []
      let plane = []
      let depart = []
      let arrive = []
      if (!error && response.statusCode == 200) {
        $ = cheerio.load(html)
        $('._2Jxd9').each( function(i, element) {
          let a = $(this).innerHTML
          price.push(a)
        })
        $('.lpNE1').each( function(i, element) {
          let b = $(this).text()
          plane.push(b)
        })
        $('._2H7tf :first-child').each( function(i, element) {
          let c = $(this).children().text()
          depart.push(c)
        })
        $('._2H7tf :nth-child(2)').each( function(i, element) {
          let d = $(this).children().text()
          arrive.push(d)
        })
      }
      for(let i=0; i<price.length; i++) {
        //console.log(i + '. ' + color.yellow(plane[i]) + ", " + color.white(depart[i] + ' -> ' + arrive[i]) + " :: " + color.cyan(price[i]));
        //console.log(i + '. ' + color.cyan(price[i]));
      }
    });
}
