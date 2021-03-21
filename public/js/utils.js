

function getUrlVars() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,
    function (m, key, value) {
      vars[key] = value;
    });
  return vars;
}

function removeUrlVars() {
  window.location.href = window.location.href.split(/[?#]/)[0]
}



function reloadIfLoggedOut(jqxhr) {
  if (jqxhr.getResponseHeader("content-type").match(/text\/html;/) !== null) {
    deleteCookie("SessId");
    window.location.href = window.location.pathname;
  }
}


function collectUserInfo(div, passwordCantBeEmpty) {
  var conf = {};
  conf.username = $("div").find("#username").val().trim();
  conf.name = $("div").find("#name").val().trim();
  conf.email = $("div").find("#email").val().trim();
  conf.phonenr = $("div").find("#phonenr").val().trim();
  conf.sendremainder =  $("div").find("#notify-me").prop("checked")?1:0;

  conf.password = $("div").find("#password").val().trim();
  var pwd2 = $("div").find("#confirm-password").val().trim();

  if (conf.username === "") {
    modalPopUp("#popup","Användarinfo", "Användarnamn saknas!!");
    return null;
  }

  if (conf.email === "" || !conf.email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
    modalPopUp("#popup","Användarinfo", "Mailadress saknas eller verkar vara ogiltig!!");
    return null;
  }
  if (passwordCantBeEmpty) {
    if (conf.password === "") {b
      modalPopUp("#popup","Användarinfo", "Lösenord saknas!!");
      return null;
    }
  }

  if (conf.password !== pwd2) {
    modalPopUp("#popup","Användarinfo", "Lösenorden stämmer inte överens!!");
    return null;
  }

  if($("#accept-terms").length>0 && $("#accept-terms").is(":checked")==false) {
    modalPopUp("#popup","Godkänn villkor", "Du måste godkänna villkoren!");
    return null;
  }

  if (conf.password === "") {
    conf.password = undefined;
  }
  return conf;
}


function collectLoginInfo(div) {
  var conf = {};
  conf.username = $("div").find("#username").val().trim();
  conf.password = $("div").find("#password").val().trim();

  if (conf.username === "") {
    modalPopUp("#popup","Inloggning", "Användarnamn saknas!!");
    return null;
  }
  if (conf.password === "") {
    modalPopUp("#popup","Inloggning", "Lösenord saknas!!");
    return null;
  }
  return conf;

}

function getCookie(name) {
  var cookies = document.cookie.split(';');
  for (var i = 0; i < cookies.length; ++i) {
    var pair = cookies[i].trim().split('=');
    if (pair[0] == name)
      return pair[1];
  }
  return null;
};

function deleteCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}


// This script is released to the public domain and may be used, modified and
// distributed without restrictions. Attribution not necessary but appreciated.
// Source: http://weeknumber.net/how-to/javascript 

// Returns the ISO week of the date.
Date.prototype.getWeek = function() {
  var date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function getWeekDay(date) {
  var days = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'];
  return days[date.getDay()];
}


function sendRows(drawData,rows,systemSize) {
  var form=$("#send-rows");

  var product="";
  switch(drawData.product) {
    case "Stryktipset": 
        product="stryktipset"
        break;
    case "Europatipset":
        product="europatipset";
        break;
    case "Topptipset":
    case "Topptipset Extra":
    case "Topptipset Stryk":    
        product="topptipset";
        break;
  }
  var draw_id=drawData.productId+"_"+drawData.drawnumber;

  var betRow=rows.join(",");
  var url="https://spela.svenskaspel.se/"+product+"/"+draw_id+"/?row="+betRow;

  window.open(url);
}

/**
 * Takes a multiline string with bets, example:
 * "12
 *  2x
 * "
 * and instanciates the betting table with this rows.
 * 
 * @param {*} tableElem - a table element to put the rows 
 * @param {*} rowLines - a string with multiple lines each line should match [1Xx2]+
 */
function pasteRows(tableElem,rowLines) {
  if(rowLines==null || rowLines.match(/^([1xX2]+\n?)+$/)==null) {
    return false;
  }
  clearRows(tableElem);
  var rows=rowLines.trim().split("\n");
  for(var i=0;i<rows.length;i++) {
    var rowElem=tableElem.find("#row-"+(i+1));
    var bets=rowElem.find(".1x2");
    rows[i].split("").forEach(b=>{
      switch(b.toLowerCase()) {
        case "1":
          bets[0].click();
          break;
          case "x":
            bets[1].click();
            break;
          case "2":
            bets[2].click();
            break;
        }

    })
  }
  return true;
}


function parseResult(matchResult) {
  let res;
  if (matchResult && matchResult.match(/Lottad /)) {
    res = matchResult.replace("Lottad ", "");
  } else {
    let tmp = matchResult.split("-");
    let home = parseInt(tmp[0].trim());
    let away = parseInt(tmp[1].trim());
    if (home > away) {
      res = "1";
    } else if (home === away) {
      res = "X";
    } else {
      res = "2";
    }
  }
  return res;
}

function clearRows(tableElem) {
  tableElem.find(".1x2").addClass("off").removeClass("on");
}


function isDemo() {
  if(globals.userinfo.userid<0 && !globals.activeGroup.admin) {
    return true;
  } else {
    return false;
  }
}



/**
 * Make a html table sortable by clicking on its header columns
 * @param {JQuery-element} table - a jquery-element that i a html-table
 * @param {Object} [options] - {
 *                    cmpFun: compare function used when sorting (default string compare),
 *                    initialOrder: "desc"|"asc" sortorder to begin with (default "desc")
 *                    initialCol: column number to use for initial-sort (if missing, no sorting)
 *                     
 *                  }
 */

function initSortableTable(table,options) {

  let cmpFun=function(e1,e2) {return e1.localeCompare(e2);};
  let initialCol=undefined;
  let initialOrder="desc";
  if (options) {
    if (options.cmpFun) {
      cmpFun = options.cmpFun;
    }
    if(options.initialOrder && options.initialOrder.match(/asc/i)) {
      initialOrder="asc";
    }
    initialCol=options.initialCol;
  }
  let iconClass="fa-chevron-circle-up";
  if(initialOrder==="asc") {
    iconClass="fa-chevron-circle-down";
  }


  table.find("th").each((i,e)=>{$(e).html($(e).html()+"<i style='padding-left:5px;color:#f6d403;display:none' class='fa "+iconClass+" clickable'></i>")});
  table.find("th").each((i,e)=>{
    $(e).click(e=>{
      table.find(".clickable").hide();
      table.find("th:nth-child("+(i+1)+") i").toggleClass('fa-chevron-circle-down fa-chevron-circle-up');
      table.find("th:nth-child("+(i+1)+") i").show();

      let tableVals=[];
      table.find("tbody tr").each((i,e)=>{
        let row=[];
        $(e).find("td").each((i2,e2)=>{
          row.push($(e2).text());
        });
        tableVals.push(row);
      });
      let sorted;
      if(table.find("th:nth-child("+(i+1)+") i").hasClass("fa-chevron-circle-down")) {
        console.log("sort desc");
        sorted=tableVals.sort((e1,e2)=>{return cmpFun(e1[i],e2[i])});
      } else {
        console.log("sort asc");
        sorted=tableVals.sort((e1,e2)=>{return cmpFun(e2[i],e1[i])});
      }

      let r=0;
      table.find("tbody tr").each((i,e)=>{
        let row=sorted[r++];
        let c=0;
        $(e).find("td").each((i2,e2)=>{
          $(e2).text(row[c++]);
        });
      });


    })
  });

  if(initialCol) {
    table.find("th:nth-child("+(initialCol+1)+")").click();
  }
  
}



function initAutoComplete(input,handler) {
  var dataListId=input.attr("id")+"_datalist";
  var display=function(vals) {
    var datalistElm=input.parent().find("#"+dataListId);
    datalistElm.empty();
    vals.forEach(function(e) {
      datalistElm.append("<option>");
      datalistElm.children()[datalistElm.children().length-1].value=e;

    })
    console.log(vals);
  }

  input.attr("list",dataListId)
  input.after("<datalist id='"+dataListId+"'/>");

  input.keyup(function(event){
    handler(input.val(),display);
    console.log(input.val());
  })
}


function dateFormat(date,template) {
  let d=new Date(date);
  let result=template;
  result=result.replaceAll("YYYY",d.getFullYear());
  result=result.replaceAll("MM",((d.getMonth()+1)+"").padStart(2,"0"));
  result=result.replaceAll("DD",(d.getDate()+"").padStart(2,"0"));
  result=result.replaceAll("hh",(d.getHours()+"").padStart(2,"0"));
  result=result.replaceAll("mm",(d.getMinutes()+"").padStart(2,"0"));
  result=result.replaceAll("ss",(d.getSeconds()+"").padStart(2,"0"));
  return result;
}